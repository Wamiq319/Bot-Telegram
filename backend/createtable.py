from dotenv import load_dotenv
import mysql.connector
from mysql.connector import Error
import os
load_dotenv()

# Define the database connection parameters
db_config = {
    'host': os.getenv("DB_HOST"),
    'user': os.getenv("DB_USER"),
    'password': os.getenv("DB_PASSWORD"),
    'database': os.getenv("DATABASE")
}

try:
    # Establish a connection to the MySQL database
    conn = mysql.connector.connect(**db_config)
    if conn.is_connected():
        print("Connected to the MySQL database")

        cursor = conn.cursor()

        # Define the SQL command to create the table (if it doesn't exist)
        create_table_query = '''
        CREATE TABLE IF NOT EXISTS Users (
            UserId VARCHAR(255) PRIMARY KEY,
            Username VARCHAR(255),
            Refertotal INT,
            X VARCHAR(255),
            alreadydailyclaimed INT,
            claimedtotal INT,
            dailyclaimedtime BIGINT,
            dailycombotime BIGINT,
            discord VARCHAR(255),
            facebook VARCHAR(255),
            instagram VARCHAR(255),
            invitedby VARCHAR(255),
            miningstarttime VARCHAR(255),
            rate VARCHAR(255),
            telegram VARCHAR(255),
            timeinminute VARCHAR(255),
            totalcollectabledaily VARCHAR(255),
            totalstim FLOAT,
            youtube VARCHAR(255),
            walletid VARCHAR(255)
        );
        '''
        # Execute the SQL command to create the table if it doesn't exist
        cursor.execute(create_table_query)

        # List of columns to add to the existing table
        new_columns = [
            ('inv5', 'VARCHAR(255)'),
            ('inv10', 'VARCHAR(255)'),
            ('inv20', 'VARCHAR(255)'),
            ('task1', 'VARCHAR(255)'),
            ('task2', 'VARCHAR(255)')
        ]

        # Loop through each new column and add it to the existing table if it doesn't exist
        for column_name, column_type in new_columns:
            # Use ALTER TABLE to add the new column
            try:
                cursor.execute(f"ALTER TABLE Users ADD COLUMN {column_name} {column_type};")
                print(f"Column '{column_name}' added successfully.")
            except Error as e:
                if 'duplicate column name' in str(e):
                    print(f"Column '{column_name}' already exists, skipping.")
                else:
                    raise e

        # Commit the changes
        conn.commit()

except Error as e:
    print(f"Error: {e}")

finally:
    # Close the connection
    if conn.is_connected():
        cursor.close()
        conn.close()
        print("Connection to the MySQL database closed.")