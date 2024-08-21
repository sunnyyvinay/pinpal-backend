-- run this file with psql -U me -d pinpal -f database.sql

CREATE USER me WITH PASSWORD 'password';
CREATE DATABASE pinpal;
GRANT ALL PRIVILEGES ON DATABASE pinpal TO me;
\c pinpal
CREATE TYPE friendship_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE location_type AS ENUM ('park', 'restaurant', 'shop', 'beach', 'other');