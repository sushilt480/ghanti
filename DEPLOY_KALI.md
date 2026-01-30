# Manual Deployment to Kali (10.20.0.42)

## 1. Copy Files (Detailed)
Run in **Windows PowerShell**:
```powershell
scp -r "c:\Users\sushi\Desktop\Antigravity\ghanti" kali@10.20.0.42:~/ghanti
```
*Enter password for `kali` when prompted.*

## 2. Start Server (Fixed SSL)
The previous error was because `http-server` didn't generate a certificate automatically. We will generate one manually.

Run in **Windows PowerShell**:
```powershell
ssh -t kali@10.20.0.42 "cd ~/ghanti && openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem -subj '/C=US/ST=State/L=City/O=Org/CN=localhost' && sudo http-server . --ssl --cert cert.pem --key key.pem --host 10.20.0.42 --port 443"
```
*Enter password for `kali` (and `sudo`) when prompted.*
