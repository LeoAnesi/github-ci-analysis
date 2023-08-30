# Installation

Run `yarn install`

# Usage

- Copy file `.env.example.rc` into `.env.rc`
- Change the value in `.env.rc` to your values. You can find owner and repo for your case in the url of your repo. For the token you'll need to generate one in github [here](https://github.com/settings/tokens) and give it repo + workflow access
- Run `yarn calc` or `yarn csv` if you wish to save your data as CSV as well
- Once the calculation is finished you can go in frontend folder and
- `yarn install && yarn dev`
- Go to the address provided by vite and TADA !

If you want to use the CSV export to make your own analysis, you can use this [google sheet template](https://docs.google.com/spreadsheets/d/1DeCE3kNkF2e_hpX67EYp0tB8GiAKgmKbLicC4ueDwIU)
