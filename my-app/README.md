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
Installation Instructions
To set up a project on your local system, follow these steps:

Verify that Node.js is installed on the system.
Replicate the project repository: gitclone https://github.com/your-repo/s5310537-project.git
Go to the project directory: cds5310537-project
Install Angular CLI globally: npm install -g @angular/cli
Go to the server directory: cd src/server
Install server dependency: npm install
Start server: node index.js
Implementation Guidelines
To run the Angular Development Server:

Start the Angular Development Server: ngserve --open
This command automatically opens http://localhost:4200/ in the default browser.
Changing the source file automatically reloads the application.
development server
Run ng serve for the development server. Go to http://localhost:4200/. The application will automatically reload whenever you change the source file.

Code scaffolding
Run ng generate component component-name to create a new component. You can also use ng generate directive|pipe|service|class|guard|interface|enum|module.

Build
Run ng build to build the project. Build artifacts are stored in the dist/ directory.

Run a unit test
To run the unit test through Karma, run ng test.

Run end-to-end tests
To run end-to-end testing, run nge2e. This command requires adding a package that implements end-to-end testing capabilities.

Additional Help
For additional help with the Angular CLI, use nghelp or visit the Angular CLI Overview and Command Reference page.