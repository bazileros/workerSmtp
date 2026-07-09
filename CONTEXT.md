# Mail Dispatch Service

An internal service that accepts email send requests, queues them, and delivers them via SMTP over Cloudflare Workers.

## Language

**Mail Dispatch Service**:
The system as a whole — accepts send requests, queues them, delivers via SMTP, tracks delivery status, and provides admin oversight.
_Avoid_: Mail worker, mailing worker, mail queue

**Caller Service**:
An internal system that sends emails via the Mail Dispatch Service API, authenticating with an API key.
_Avoid_: Client, consumer, app

**Operator**:
A human team member who manages SMTP profiles, email templates, views delivery status, retries failed sends, and can also send emails directly via session-based auth.
_Avoid_: Admin, user, manager