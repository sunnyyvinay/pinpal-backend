CREATE SCHEMA users;

CREATE TABLE users.users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    pass TEXT NOT NULL,
    birthday DATE NOT NULL,
    profile_pic BYTEA,
    email TEXT,
    phone_no TEXT
);

-- CREATE TABLE users.friendships (
--     source_id UUID REFERENCES users(user_id) NOT NULL,
--     target_id UUID REFERENCES users(user_id) NOT NULL,
--     friend_status friendship_status NOT NULL,
--     PRIMARY KEY(source_id, target_id)
-- );

-- CREATE TABLE users.pins (
--     pin_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     user_id UUID REFERENCES users(user_id) NOT NULL,
--     lat_long POINT NOT NULL,
--     title TEXT NOT NULL,
--     caption TEXT,
--     create_date DATE NOT NULL,
--     pictures BYTEA[] NOT NULL,
--     location_tags location_type[],
--     user_tags UUID[] REFERENCES users(user_id)
-- );

-- CREATE TABLE users.pin_likes (
--     user_id UUID REFERENCES users(user_id) NOT NULL,
--     pin_id UUID REFERENCES pins(pin_id) NOT NULL,
--     PRIMARY KEY(user_id, pin_id)
-- );