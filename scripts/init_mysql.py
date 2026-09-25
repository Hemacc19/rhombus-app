import pymysql

def init_database():
    hosts = ["127.0.0.1", "localhost"]
    port = 3306
    user = "root"
    password = "Hemsagar@8970"
    db_name = "rhombus_db"

    connected = False
    for host in hosts:
        print(f"Testing MySQL connection to {host}:{port} as user '{user}'...")
        try:
            connection = pymysql.connect(
                host=host,
                port=port,
                user=user,
                password=password,
                connect_timeout=3
            )
            with connection.cursor() as cursor:
                cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
                cursor.execute(f"USE `{db_name}`;")
                print(f"✅ SUCCESS! MySQL Database '{db_name}' created and verified on {host}:{port}!")
            connection.close()
            connected = True
            break
        except Exception as e:
            print(f"⚠️ Connection to {host} failed: {e}")

    if not connected:
        print("❌ Could not connect to MySQL server. Please ensure MySQL Server service is running in Windows Services.")

if __name__ == "__main__":
    init_database()
