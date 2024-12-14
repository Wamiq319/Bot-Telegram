from flask import Flask, request, jsonify
import time
from flask_cors import CORS
from datetime import datetime
from dateutil.relativedelta import relativedelta
import requests
import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv
load_dotenv()
app = Flask(__name__)
CORS(app)

db_config = {
    'host': os.getenv("DB_HOST"),
    'user': os.getenv("DB_USER"),
    'password': os.getenv("DB_PASSWORD"),
    'database': os.getenv("DATABASE")
}

# Function to get a database connection
class get_db_connection:
    def __init__(self):
        self.conn = mysql.connector.connect(**db_config)

    def __enter__(self):
        return self.conn
    def __exit__(self,exc_value,exc_type,exc_tb):
        self.conn.close()


# Retry logic for handling MySQL errors
def execute_query_with_retry(conn, query, params=None):
    max_retries = 5
    for attempt in range(max_retries):
        try:
            cursor = conn.cursor(buffered=True,dictionary=True)
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            conn.commit()
            return cursor
        except Error as e:
            if "Lock wait timeout" in str(e):
                print(f"Database is locked, retrying... ({attempt + 1}/{max_retries})")
                time.sleep(1)  # Wait before retrying
            else:
                raise
    raise Error("Failed to execute query after multiple retries")

@app.route('/add_user', methods=['POST'])
def add_user():
    data = request.json
    print(request.headers,data)
    user_id = data.get('UserId')
    username = data.get('Username')

    if not user_id or not username:
        return jsonify({'error': 'UserId and Username are required'}), 400

    try:
        with get_db_connection() as conn:

            # Check if the user already exists
            query_check = "SELECT * FROM Users WHERE UserId = %s"
            user_exists = execute_query_with_retry(conn, query_check, (str(user_id),)).fetchone()

            if user_exists:
                # User alreadyt exists, retdssurn a message or update user info if needed
                return jsonify({'message': 'User already exists'}), 200

            # If the user doesn't exist, insddert with default values
            query_insert = """
            INSERT INTO Users (
                UserId,totalstim, invitedby, miningstarttime, timeinminute, rate,
                youtube, instagram, discord, telegram, X, facebook, Username,
                dailycombotime, dailyclaimedtime,lastAdClaimedTime, alreadydailyclaimed, walletid
            ) VALUES (
                %s, 0, %s, '0', '180', '0.3', NULL, NULL, NULL, NULL, NULL, NULL, %s,0, 0, 0, 0, NULL
            )
            """
            execute_query_with_retry(conn, query_insert, (str(user_id), str(data.get('invitedby')), str(username)))
            query_update_referral = """
                UPDATE Users SET Refertotal = Refertotal + 1 WHERE UserId = %s
            """
            execute_query_with_retry(conn, query_update_referral, (data.get('invitedby'),))
            return jsonify({'message': 'User added successfully with default values'}), 201

    except Error as e:
        print(f"MYSQL Error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/get_database', methods=['GET'])
def get_database():
    try:
        with get_db_connection() as conn:
            query = "SELECT * FROM Users"
            cursor = execute_query_with_retry(conn, query)
            data = cursor.fetchall()
            return jsonify({'data': data}), 200
    except Error as e:
        # Return the database error message from the exception
        return jsonify({'error': f'Database error: {str(e)}'}), 500
    except Exception as e:
        # Return the generic exception message, if a non-database error occurs
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

@app.route('/delete-user', methods=['DELETE'])
def delete_user():
    user_id = request.args.get('UserId')
    if not user_id:
        return jsonify({'error': 'UserId is required'}), 400

    try:
        with get_db_connection() as conn:
            query_check = "SELECT * FROM Users WHERE UserId = %s"
            user_exists = execute_query_with_retry(conn, query_check, (str(user_id),)).fetchone()
            
            if not user_exists:
                return jsonify({'error': f'User with UserId {user_id} does not exist'}), 404
            
            query_delete = "DELETE FROM Users WHERE UserId = %s"
            execute_query_with_retry(conn, query_delete, (str(user_id),))
            
            return jsonify({'message': f'User with UserId {user_id} has been deleted.'}), 200
            
    except Error as e:
        return jsonify({'error': 'Database error', 'details': str(e)}), 500
    except Exception as e:
        return jsonify({'error': 'An error occurred', 'details': str(e)}), 500
    

# Endpoint to retrieve a user from the database
@app.route('/get_user', methods=['GET'])
def get_user():
    user_id = request.args.get('UserId')
    if not user_id:
        return jsonify({'error': 'UserId is required'}), 400

    try:
        with get_db_connection() as conn:

            # Retrieve user from databasex
            query = "SELECT * FROM Users WHERE UserId = %s"
            cursor = execute_query_with_retry(conn, query, (str(user_id),))
            user = cursor.fetchone()

            if not user:
                return jsonify({'error': 'User not found'}), 404

            user_dict = dict(user)# Convert row to dictionary
            Username = user_dict['Username']
            try:
                bot_token = os.getenv("BOT_TOKEN")
                url = f'https://api.telegram.org/bot{bot_token}/getChat?chat_id={user_id}'
                response = requests.get(url)
                if response.ok:
                    response = response.json()
                    username = response.get("result", {}).get("username")
                    if username != Username:
                        if username == None:
                            username = "Default Username"
                            query = "UPDATE Users SET Username = %s  WHERE UserId = %s"
                            cursor = execute_query_with_retry(conn, query, (username, str(user_id),))
                        else:
                            query = "UPDATE Users SET Username = %s  WHERE UserId = %s"
                            cursor = execute_query_with_retry(conn, query, (username, str(user_id),))
                        user_dict['Username'] = username
            except:
                # Log error or handle it appropriately
                return jsonify({'error': 'Failed to connect to Telegram API'}), 500

            return jsonify({'data': user_dict}), 200

    except Error as e:
        print(f"MySQL Error: {e}")
        return jsonify({'error': str(e)}), 500

# Endpoint to retrieve user invitations
@app.route('/get_invitations', methods=['GET'])
def get_invitations():
    user_id = request.args.get('UserId')
    if not user_id:
        return jsonify({'error': 'UserId is required'}), 400

    try:
        with get_db_connection() as conn:

            # Find users invited by the given user_id
            query = """
                SELECT Username, totalstim
                FROM Users
                WHERE invitedby = %s;
            """

            cursor = execute_query_with_retry(conn, query,(user_id,))
            users = cursor.fetchall()

            if not users:
                return jsonify({'error': 'No invitations found'}), 404

            users_list = [dict(user) for user in users]
            return jsonify(users_list), 200

    except Error as e:
        print(f"MySQL Error: {e}")
        return jsonify({'error': str(e)}), 500

# Endpoint to update a user in the database
@app.route('/update_user', methods=['POST'])
def update_user():
    data = request.json
    user_id = data.get('UserId')

    if not user_id:
        return jsonify({'error': 'UserId is required'}), 400

    # Exclude UserIsd from update fields and prepare the SQL query
    update_data = {k: v for k, v in data.items() if k != 'UserId'}
    if not update_data:
        return jsonify({'error': 'No data provided for update'}), 400

    set_clause = ', '.join([f"{key} = %s" for key in update_data.keys()])
    values = list(update_data.values())

    try:
       with get_db_connection() as conn:
            # Update user in the database
            query = f"UPDATE Users SET {set_clause} WHERE UserId = %s"
            cursor = execute_query_with_retry(conn, query, values + [str(user_id)])

            if cursor.rowcount == 0:
                return jsonify({'error': 'User not found'}), 404

            return jsonify({'message': 'User updated successfully'}), 200

    except Error as e:
        print(f"MySQL Error: {e}")
        return jsonify({'error': str(e)}), 500



# Define the entries as in your TypeScript code
entries = [[1000000, 1380326400], [2768409, 1383264000], [7679610, 1388448000], [11538514, 1391212000], [15835244, 1392940000], [23646077, 1393459000], [38015510, 1393632000], [44634663, 1399334000], [46145305, 1400198000], [54845238, 1411257000], [63263518, 1414454000], [101260938, 1425600000], [101323197, 1426204000], [103151531, 1433376000], [103258382, 1432771000], [109393468, 1439078000], [111220210, 1429574000], [112594714, 1439683000], [116812045, 1437696000], [122600695, 1437782000], [124872445, 1439856000], [125828524, 1444003000], [130029930, 1441324000], [133909606, 1444176000], [143445125, 1448928000], [148670295, 1452211000], [152079341, 1453420000], [157242073, 1446768000], [171295414, 1457481000], [181783990, 1460246000], [222021233, 1465344000], [225034354, 1466208000], [278941742, 1473465000], [285253072, 1476835000], [294851037, 1479600000], [297621225, 1481846000], [328594461, 1482969000], [337808429, 1487707000], [341546272, 1487782000], [352940995, 1487894000], [369669043, 1490918000], [400169472, 1501459000], [616816630, 1529625600], [681896077, 1532821500], [727572658, 1543708800], [796147074, 1541371800], [925078064, 1563290000], [928636984, 1581513420], [1054883348, 1585674420], [1057704545, 1580393640], [1145856008, 1586342040], [1227964864, 1596127860], [1382531194, 1600188120], [1658586909, 1613148540], [1660971491, 1613329440], [1692464211, 1615402500], [1719536397, 1619293500], [1721844091, 1620224820], [1772991138, 1617540360], [1807942741, 1625520300], [1893429550, 1622040000], [1972424006, 1631669400], [1974255900, 1634000000], [2030606431, 1631992680], [2041327411, 1631989620], [2078711279, 1634321820], [2104178931, 1638353220], [2120496865, 1636714020], [2123596685, 1636503180], [2138472342, 1637590800], [3318845111, 1618028800], [4317845111, 1620028800], [5162494923, 1652449800], [5186883095, 1648764360], [5304951856, 1656718440], [5317829834, 1653152820], [5318092331, 1652024220], [5336336790, 1646368100], [5362593868, 1652024520], [5387234031, 1662137700], [5396587273, 1648014800], [5409444610, 1659025020], [5416026704, 1660925460], [5465223076, 1661710860], [5480654757, 1660926300], [5499934702, 1662130740], [5513192189, 1659626400], [5522237606, 1654167240], [5537251684, 1664269800], [5559167331, 1656718560], [5568348673, 1654642200], [5591759222, 1659025500], [5608562550, 1664012820], [5614111200, 1661780160], [5666819340, 1664112240], [5684254605, 1662134040], [5684689868, 1661304720], [5707112959, 1663803300], [5756095415, 1660925940], [5772670706, 1661539140], [5778063231, 1667477640], [5802242180, 1671821040], [5853442730, 1674866100], [5859878513, 1673117760], [5885964106, 1671081840], [5982648124, 1686941700], [6020888206, 1675534800], [6032606998, 1686998640], [6057123350, 1676198350], [6058560984, 1686907980], [6101607245, 1686830760], [6108011341, 1681032060], [6132325730, 1692033840], [6182056052, 1687870740], [6279839148, 1688399160], [6306077724, 1692442920], [6321562426, 1688486760], [6364973680, 1696349340], [6386727079, 1691696880], [6429580803, 1692082680], [6527226055, 1690289160], [6813121418, 1698489600], [6865576492, 1699052400], [6925870357, 1701192327]]

# Sort the entries based on ID
entries.sort(key=lambda x: x[0])

def predict_creation_date(id: int) -> datetime:
    """Predicts the creation date for a given ID."""
    # Handle case for ID lower than the lowest known ID
    if id <= entries[0][0]:
        return datetime.fromtimestamp(entries[0][1])

    # Process entries to find the correct time range
    for i in range(1, len(entries)):
        if entries[i-1][0] <= id <= entries[i][0]:
            t = (id - entries[i-1][0]) / (entries[i][0] - entries[i-1][0])
            reg_time = int(entries[i-1][1] + t * (entries[i][1] - entries[i-1][1]))
            return datetime.fromtimestamp(reg_time)

    # Handle case for ID greater than the highest known ID
    return datetime.fromtimestamp(entries[-1][1])

@app.route('/get_user_ranking', methods=['GET'])
def get_user_ranking():
    user_id = request.args.get('UserId')
    if not user_id:
        return jsonify({'error': 'UserId is required'}), 400

    try:
        # Query to select all users, ordered by totalstim in descending order
        with get_db_connection() as conn:
            cursor = execute_query_with_retry(conn,"""
                    SELECT UserId, Username, totalstim
                    FROM Users
                    ORDER BY totalstim DESC
                    LIMIT 100
                """)
            top_users = cursor.fetchall()

            # Ensure we have users before proceeding
            if not top_users:
                return jsonify({'error': 'No users found'}), 404
            # Generate a list of dictionaries for each user
            top_users_list = [{'rank': index + 1, 'username': user['Username'], 'totalstim': user['totalstim']}
                        for index, user in enumerate(top_users)]

            # Find the requested user's details separately
            cursor.execute("""
                SELECT UserId, Username, totalstim
                FROM Users
                WHERE UserId = %s
            """, (user_id,))
            requested_user_data = cursor.fetchone()

            if not requested_user_data:
                requested_user = {'error': 'User not found'}
            else:
                # Get the user's rank by counting how many users have a higher totalstim
                cursor.execute("""
                    SELECT COUNT(*) AS `Rank`
                    FROM Users
                    WHERE totalstim > %s
                """, (requested_user_data['totalstim'],))
                rank = cursor.fetchone()['Rank'] + 1  # rank is the count of users with higher totalstim plus one for the current user
                requested_user = {
                    'position': rank,
                    'username': requested_user_data['Username'],
                    'totalstim': requested_user_data['totalstim']
                }

            # Count total number of users
            cursor.execute("SELECT COUNT(*) AS `TotalUsers` FROM Users")
            total_users = cursor.fetchone()['TotalUsers']
            formatted_total = f"{total_users / 1000:.3f}k"  # Format to show three decimal places and a 'k'

            response = {
                'requested_user': requested_user,
                'top_users': top_users_list,
                'total_users': formatted_total
            }

            return jsonify(response), 200

    except Error as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get_creation_month_count')
def get_creation_month_count():
    try:
        user_id = int(request.args.get('userid'))
    except (TypeError, ValueError):
        return jsonify({'error': 'Invalid or missing user ID'}), 400

    creation_date = predict_creation_date(user_id)
    current_date = datetime.now()
    # Calculate the difference in years as a decimal to one decimal place
    total_years = relativedelta(current_date, creation_date).years + relativedelta(current_date, creation_date).months / 12.0
    years_diff = round(total_years, 1)

    # Define reward tiers based on full years
    reward_tiers = {
        0: 75,   # Less than 1 year
        1: 150,  # 1-2 years
        2: 225,  # 2-3 years
        3: 300,  # 3-4 years
        4: 375,  # 4-5 years
        5: 450,  # 5-6 years
        6: 525,  # 6-7 years
        7: 600,  # 7-8 years
        8: 675,  # 8-9 years
        9: 750   # 9-10 years
    }

    # Get reward based on the full number of years
    full_years = int(total_years)  # Use the integer value of years for the reward
    reward = reward_tiers.get(full_years, 7500 if full_years >= 10 else 0)  # Default to 7500 if 10+ years or 0 if not covered by tiers

    return jsonify({'user_id': user_id, 'years': years_diff, 'reward': reward})


@app.route('/check_telegram_status', methods=['GET'])
def check_telegram_status():
    user_id = request.args.get('user_id')
    chat_id = request.args.get('chat_id')
    print(f"Received user_id: {user_id}, chat_id: {chat_id}")  # Debugging output

    if not user_id or not chat_id:
        return jsonify({'error': 'User ID and Chat ID are required'}), 400

    bot_token = os.getenv("BOT_TOKEN")
    url = f'https://api.telegram.org/bot{bot_token}/getChatMember?chat_id={chat_id}&user_id={user_id}'
    response = requests.get(url)
    if response.ok:
        data = response.json()
        print("Response from Telegram API:", data)  # Additional debugging output
        if data.get('ok') and 'result' in data and 'status' in data['result']:
            if data['result']['status'] in ['member', 'administrator', 'creator',"owner"]:
                return jsonify({'status': '1'})  # User is a member, admin, or creator
        return jsonify({'status': '0'})  # Correct status not found
    else:
        return jsonify({'error': 'Failed to connect to Telegram API'}), 500

if __name__ == "__main__":
    app.run(debug=True, threaded=True, port=8000)