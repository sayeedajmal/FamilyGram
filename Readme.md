# Documentation

## AUTH

    - /auth
    POST
        - sendSignupOtp (parm email)
        - register (Body User)
        - login (Body user)

✅ Why WebSocket alone isn't enough
WebSocket is awesome for pushing notifications to clients...
But it doesn't listen to events across services.

So if:

Someone likes a post ➝ Post Service emits event

Someone follows a user ➝ User Service emits event

Someone comments ➝ Comment Service emits event

➡️ WebSocket won't receive these events on its own.
That's where Kafka comes in.
