# Deploying to Apache (Kali Linux)

To run this on Apache, we need to:
1.  Enable SSL (HTTPS is required for sensors).
2.  Move files to the Apache web root.

## 1. Copy Files to Kali
(If you haven't already)
```powershell
scp -r "c:\Users\sushi\Desktop\Antigravity\ghanti" kali@10.20.0.42:~/ghanti
```

## 2. Setup Apache & HTTPS
Run this command in PowerShell to SSH in and configure Apache:

```powershell
ssh -t kali@10.20.0.42 "sudo apt update && sudo apt install -y apache2 && sudo a2enmod ssl && sudo a2ensite default-ssl && sudo cp -r ~/ghanti/* /var/www/html/ && sudo systemctl restart apache2"
```

## 3. Test
Go to: `https://10.20.0.42`
*Note: You might see the default Apache "It Works" page if you didn't delete `index.html` first. The command above overwrites files, but if `index.html` was protected or different, we might need to clear `/var/www/html` first.*

**Better Command (Cleans /var/www/html first):**
```powershell
ssh -t kali@10.20.0.42 "sudo apt update && sudo apt install -y apache2 && sudo a2enmod ssl && sudo a2ensite default-ssl && sudo rm -rf /var/www/html/* && sudo cp -r ~/ghanti/* /var/www/html/ && sudo systemctl restart apache2"
```
