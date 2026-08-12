Password Reset OTP Bypass via Response Manipulation Using HTTP Status Codes

First, we go to the Forgot Password function.
![alt text](<Screenshot 2026-08-12 at 03.20.46-1.png>)

We enter the email address we want to target.
![alt text](<Screenshot 2026-08-12 at 03.21.53-1.png>)

Before starting the attack, we first use the real OTP code to understand how the server behaves when it receives a valid code. This gives us a baseline for comparison.
![alt text](<Screenshot 2026-08-12 at 03.23.07-1.png>)

Now we start intercepting the traffic using Burp Suite. Here, we can see the request and response.
![alt text](<Screenshot 2026-08-12 at 03.24.58.psd>)

We save the response for later comparison. As we can see, the process works normally and the application takes us to the password-changing function.
![alt text](<Screenshot 2026-08-12 at 03.27.18.png>)

Next, we try to change the password while intercepting the requests and responses.
![alt text](<Screenshot 2026-08-12 at 03.31.08.png>)
The first request is not important for the bypass. It is only used to check whether the password meets the application's requirements.

After this request, we get the actual password-changing request.
![alt text](<Screenshot 2026-08-12 at 03.32.15-2.png>)


From the normal flow, we can see that the successful requests return HTTP 200 OK.
![alt text](<Screenshot 2026-08-12 at 03.28.29.png>)
Now we try using a wrong OTP code.
![alt text](<Screenshot 2026-08-12 at 03.39.25.png>)

The previous flow used the real OTP. This time, we intentionally enter an incorrect code.
![alt text](<Screenshot 2026-08-12 at 03.42.41.png>)
If we submit the wrong code normally, the application tells us that the OTP is invalid. We use Burp Suite to intercept the response and see how the server responds.
![alt text](<Screenshot 2026-08-12 at 03.42.41-1.png>)
The server returns:
HTTP/2 400 Bad Request
From the legitimate flow, we know that a successful request returns:
HTTP/2 200 OK
This gives us an interesting difference between the valid and invalid flows.
We intercept the response and modify the status code from 400 Bad Request to 200 OK.
After forwarding the modified response, the application accepts the response and takes us to the password-changing page.
![alt text](<Screenshot 2026-08-12 at 03.28.29-1.png>)
However, when we try to complete the password change, the application performs another OTP validation. The request still returns 400, meaning that the OTP is being verified again during the password-changing stage.
![alt text](image-14.png)
We then perform the same response manipulation on the next validation response and change the status code to 200 OK.
![alt text](<Screenshot 2026-08-12 at 05.07.24.png>)
After this, the application accepts the modified responses and completes the password-reset process.
![alt text](<Screenshot 2026-08-12 at 03.49.01.png>)
The main issue is response manipulation via HTTP status codes. The client is using the server's response status to determine whether the OTP verification was successful. Since the response can be intercepted and modified before the client processes it, this should not be trusted as a security boundary.

