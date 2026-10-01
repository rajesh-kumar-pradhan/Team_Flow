CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID NOT NULL
        REFERENCES organizations(id)
        ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    role VARCHAR(30) NOT NULL
        CHECK (
            role IN (
                'ADMIN',
                'PROJECT_MANAGER',
                'DEVELOPER',
                'MEMBER'
            )
        ),

    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (organization_id, user_id)
);