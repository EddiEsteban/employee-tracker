// loads configuration infromation in env file
require('dotenv').config()
const mysql = require("mysql");
const inquirer = require("inquirer");
const chalk = require('chalk')

PORT = 3306

class Database {
  constructor( config ) {
      this.connection = mysql.createConnection( config );
  }
  query( sql, args ) {
      return new Promise( ( resolve, reject ) => {
          this.connection.query( sql, args, ( err, rows ) => {
              if ( err )
                  return reject( err );
              resolve( rows );
          } );
      } );
  }
  close() {
      return new Promise( ( resolve, reject ) => {
          this.connection.end( err => {
              if ( err )
                  return reject( err );
              resolve();
          } );
      } );
  }
}

const db = new Database({
  host: "localhost",
  port: process.env.PORT || PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PWD,
  database: process.env.DB_NAME,
  insecureAuth: true
});

let response
let roles, employees, departments

async function mainApp(){
    mainMenu()
    async function mainMenu(){
        response = await inquirer.prompt([
            {   
                message: `${chalk.green(`===Employee Tracker===`)}\nWhat do you want to do?`, type: "list", name: "action", 
                choices: [ 
                    { name: "Manage Departments", value: "department" },
                    { name: "Manage Roles", value: "role" }, 
                    { name: "Manage Employees", value: "employee" },
                    { name: 'Exit', value: 'exit'}
                ] 
            }
        ])

        switch (response.action){
            case 'department': await departmentMenu(); break;
            case 'role': await roleMenu(); break;
            case 'employee': await employeeMenu(); break;
            case 'exit': await db.close()
        }

        async function employeeMenu(){
            let employeeList = await db.query( 
                "SELECT CONCAT(e.first_name,' ',e.last_name) AS employeeName,"+
                "CONCAT(m.first_name,' ',m.last_name) AS managerName,r.title,r.salary "+
                "FROM employee AS e "+
                "LEFT JOIN employee AS m ON(e.manager_id=m.id) "+
                "LEFT JOIN role AS r ON(e.role_id=r.id)" )

            console.table( employeeList )
            
            response = await inquirer.prompt([
                {   message: `${chalk.green(`==Manage Employee==`)}\nWhat do you want to do now?`, type: "list", name: "action", 
                    choices: [
                        { name: "Update Employee Role", value: "update" }, 
                        { name: "Add Employee", value: "add" },
                        { name: "Return to the main menu", value: "return" } 
                    ] 
                }
            ])

            switch (response.action){
                case 'update': await updateEmployee(); break;
                case 'add': await addEmployee(); break;
                case 'return': await mainMenu(); break;
            }
        }

        async function updateEmployee(){

            let dbRole = await db.query( "SELECT * FROM role")
            roles = []
            dbRole.forEach( function( item ){
                roles.push( { name: item.title, value: item.id } )
            })

            employees = []
            let dbEmployee = await db.query(`SELECT * FROM employee`)
            dbEmployee.forEach(item=>employees.push({name:item.first_name + ' ' + item.last_name, value:item.id}))

            response = await inquirer.prompt([
                {   message: 'Whose role do you want to update?', type: 'list', name: 'employee', 
                    choices: employees},
                {   message: `What is their new role?`, type: 'list', name: `role`,
                    choices: roles}
            ])

            let saveResult = await db.query(`UPDATE employee SET ? WHERE ?`,
                [{role_id: response.role}, {id: response.employee}]
            )
            console.log( `User updated.`)
            await employeeMenu()

        }
        
        async function addEmployee(){
            // load roles & departments from the database
            let dbRole = await db.query( "SELECT * FROM role")
            roles = []
            dbRole.forEach( function( item ){
                roles.push( { name: item.title, value: item.id } )
            })
            
            let dbEmployee = await db.query(`SELECT * FROM employee`)
            employees = [{name: 'No one', value: null}]
            dbEmployee.forEach(item=>employees.push({name:item.first_name + ' ' + item.last_name, value:item.id}))
                        
            response = await inquirer.prompt([
                {   message: "What is their first name?", type: "input", name: "first_name" },
                {   message: "What is their last name?", type: "input", name: "last_name" },
                {   message: "What is their role", type: "list", name: "role",
                    choices: roles 
                },
                {   message: "Who is their manager?", type: 'list', name: "manager",
                    choices: employees
                }
            ]) 

            console.log(  `user info: `, response )
            let saveResult = await db.query( "INSERT INTO employee VALUES( ?,?,?,?,? ) ", 
                                            [ 0, response.first_name, response.last_name, response.role, response.manager ] )
            console.log( `User saved.`)
            await employeeMenu()

        }
    }
    

    // if( response.action=="employee" ){
        

        
    // }
    // if (response.action=='department'){

    // }
}
mainApp()