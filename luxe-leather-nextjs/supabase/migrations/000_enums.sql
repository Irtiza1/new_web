CREATE TYPE public."OrderStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED'
);

CREATE TYPE public."RequestStatus" AS ENUM (
    'NEW',
    'QUOTE_SENT',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);
