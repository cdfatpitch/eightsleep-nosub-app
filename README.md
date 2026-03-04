# Eight Sleep On/Off Automator

This web app now does one job: turn your Eight Sleep automation **off** at a set time each morning and **on** at a set time each night. No temperature schedules, no continuous enforcement—manual changes during the day are left alone.

<img src="eightsleep-nosub-app.png" alt="Eight Sleep No-Subscription App" width="500">

## Quick start (self-host)

1. Clone or deploy this repo as a Next.js app.
2. Set env vars: `CRON_SECRET` (random string), `JWT_SECRET` (random string), `APPROVED_EMAILS` (comma separated).
3. Edit `config/onoff-config.json` to set your local 24h times (e.g., `{"off_time":"07:00","on_time":"21:00","timezone":"America/New_York"}`).
4. Log in to the web UI with an approved email to store your Eight Sleep token (email/password stays the same).
5. Run the on/off service locally (Raspberry Pi/Linux-friendly):

   ```bash
   node scripts/onoff-service.js
   ```

   - It checks the config every minute and calls `api/temperatureCron` to flip automation at the exact times.
   - Point `SERVICE_URL` env to your deployed URL if not running next to the app (default `http://localhost:3000/api/temperatureCron`).

6. Alternative: call `https://YOUR_HOST/api/temperatureCron` twice a day from any scheduler (include header `Authorization: Bearer CRON_SECRET` and query `?action=off` or `?action=on`).


Enjoy! That's it!

## How to Upgrade from an older Version?

Check the [Release Notes](https://github.com/aerotow/eightsleep-nosub-app/releases) to see what changed. I will include steps you have to do there to upgrade. After you have read the notes there and made potential changes, make sure to go to your GitHub fork and sync to the latest commit of this repository. It's just one click at the top.

## Credits

- Thanks to @lukas-clarke for his Home Assistant package eight_sleep and pyEight which gave me the idea of the possibility to use the API of the app.
- Thanks also to @mezz64 for the initial work on his pyEight package.
- Thanks to the @t3-oss team for the great T3 boilerplate on which this codebase is based.

## Disclaimer

### IMPORTANT: Please read this disclaimer carefully before using this software.

This project is an unofficial, independent effort and is not affiliated with, endorsed by, or supported by Eight Sleep, Inc. in any way. The software provided here interacts with Eight Sleep's systems through reverse-engineered methods and is not using any officially sanctioned API.

**Key Points:**

- **Unofficial Project**: This is not an official Eight Sleep product. Use it at your own risk.
- **No Warranty**: This software is provided "as is", without warranty of any kind, express or implied.

**Potential Risks:**

- Using this software may violate Eight Sleep's Terms of Service.
- It could potentially lead to account suspension or other actions by Eight Sleep.
- Future updates to Eight Sleep's systems may break this software's functionality.

**Data Security**: While we strive to handle data securely, we cannot guarantee the same level of security as Eight Sleep's official apps. Use caution when handling sensitive information.

**Legal Considerations**: The legality of reverse engineering and using unofficial APIs can vary by jurisdiction. Ensure you understand the legal implications in your area.

**No Liability**: The developers of this project are not responsible for any damages or losses, including but not limited to, damages related to data loss, service interruption, or account issues.

**Use Responsibly**: This tool is intended for personal use only. Do not use it to access or modify data of Eight Sleep accounts you do not own or have explicit permission to manage.

By using this software, you acknowledge that you have read this disclaimer, understand its contents, and agree to use the software at your own risk. If you do not agree with these terms, do not use this software.

Always prioritize the official Eight Sleep app for critical functions and data management related to your Eight Sleep products.
