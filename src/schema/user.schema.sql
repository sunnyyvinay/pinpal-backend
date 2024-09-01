CREATE SCHEMA IF NOT EXISTS users AUTHORIZATION me;

CREATE TABLE IF NOT EXISTS users.users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    pass TEXT NOT NULL,
    birthday DATE NOT NULL,
    profile_pic TEXT,
    email TEXT,
    phone_no TEXT
);

CREATE TABLE IF NOT EXISTS users.pins (
    pin_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users.users(user_id) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    title TEXT NOT NULL,
    caption TEXT,
    create_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    edit_date TIMESTAMP,
    photos TEXT[] NOT NULL,
    location_tags location_type[],
    visibility SMALLINT NOT NULL -- 0 - private, 1 - friends, 2 - public
);

-- CREATE TABLE users.friendships (
--     source_id UUID REFERENCES users(user_id) NOT NULL,
--     target_id UUID REFERENCES users(user_id) NOT NULL,
--     friend_status friendship_status NOT NULL,
--     PRIMARY KEY(source_id, target_id)
-- );

-- CREATE TABLE users.pin_likes (
--     user_id UUID REFERENCES users(user_id) NOT NULL,
--     pin_id UUID REFERENCES pins(pin_id) NOT NULL,
--     PRIMARY KEY(user_id, pin_id)
-- );