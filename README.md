# Installation

Run `yarn install`

# Usage

- Copy file `.env.example.rc` into `.env.rc`  
- Change the value in `.env.rc` to your values. You can find owner and repo for your case in the url of your repo. For the token you'll need to generate one in github [here](https://github.com/settings/tokens) and give it repo + workflow access
- create a `public` folder inside `website` directory
- Run `yarn calc`
- Once the calculation is finished you can run `npx serve website`
- Go to the address provided by serve and TADA ! 