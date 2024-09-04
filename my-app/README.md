# MyApp

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 18.2.1.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Description

The chat system is designed to facilitate real-time communication among users, grouped within designated channels and groups. This system incorporates a tiered permission structure to accommodate varying levels of administrative control and access:

Super Admin:

Ultimate control over the entire system.
Can create or delete any groups and channels.
Manages user roles and permissions across the system.
Has oversight of all group activities and can intervene in any group or channel if necessary.

Group Admin:

Manages specific groups assigned to them.
Can add or remove users from their groups.
Responsible for creating and managing channels within their groups.
Can moderate discussions and manage group-specific settings.

User:

Basic access level intended for general communication.
Can join channels and participate in discussions as permitted by their group admin.
Can view and send messages, share files, and engage in video calls within the channels they have access to.

## Install CLI and open the server and localhost
sudo npm install -g @angular/cli
cd my-app
sudo npm install
ng serve --open

cd server
node index.js