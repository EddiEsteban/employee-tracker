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



async function mainApp(){
    let response
    let roles, employees, departments
    // inner menus for performing database changes
    async function subMenu(category){
        let submenuTable
        switch (category){
            case 'department': submenuTable = await db.query(
                `SELECT title AS department FROM department`)
                break;
            case 'role': submenuTable = await db.query(
                `SELECT r.title AS role,`+ 
                `d.title AS department `+
                `FROM role as r `+
                `LEFT JOIN department AS d ON (r.department_id = d.id)`)
                break;
            case 'employee': submenuTable = await db.query( 
                "SELECT CONCAT(e.first_name,' ',e.last_name) AS employeeName,"+
                "CONCAT(m.first_name,' ',m.last_name) AS managerName,r.title,r.salary "+
                "FROM employee AS e "+
                "LEFT JOIN employee AS m ON(e.manager_id=m.id) "+
                "LEFT JOIN role AS r ON(e.role_id=r.id)" )
            }

        console.table( submenuTable )
        
        let choices = []
        if (category=='employee') choices.push({ name: `Update ${category} role`, value: "update" })
        choices.push(
            { name: `Add ${category}`, value: "add" },
            { name: "Return to the main menu", value: "return" } 
        )

        response = await inquirer.prompt([
            {   message: `${chalk.green(`==Manage ${category}==`)}\nWhat do you want to do now?`, type: "list", name: "action", 
                choices
            }
        ])

        switch (response.action){
            case 'update': await updateEntry(category); break;
            case 'add': await addEntry(category); break;
            case 'return': await mainMenu();
        }
    }
    // operation to update entries
    async function updateEntry(category){

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
        console.log( chalk.yellow(`User updated.`))
        await subMenu(category)

    }
    // operation to add entries to database
    async function addEntry(category){
                    
        let prompts = []

        if (category == 'department'){
            prompts.push(
                {   message: `What is the new department's name?`, name: 'department'}
            )
        }
        if (category == 'role'){
            let dbDepartment = await db.query(`SELECT * FROM department`)
            departments = []
            dbDepartment.forEach(item=>departments.push({name: item.title, value: item.id}))
            prompts.push(
                {   message: `What is the new role called?`, name: 'role'},
                {   message: `What is its salary`, name: `salary`},
                {   message: `To which department does it correspond?`, name: `department`, type: 'list', choices: departments}
            )
        }
        if (category == 'employee'){
            let dbRole = await db.query( "SELECT * FROM role")
            roles = []
            dbRole.forEach(item=>roles.push( { name: item.title, value: item.id }))
            
            let dbEmployee = await db.query(`SELECT * FROM employee`)
            employees = [{name: 'No one', value: null}]
            dbEmployee.forEach(item=>employees.push({name:item.first_name + ' ' + item.last_name, value:item.id}))
    
            prompts.push(
                {   message: "What is their first name?", type: "input", name: "first_name" },
                {   message: "What is their last name?", type: "input", name: "last_name" },
                {   message: "What is their role", type: "list", name: "role",
                    choices: roles 
                },
                {   message: "Who is their manager?", type: 'list', name: "manager",
                    choices: employees
                }
            )
        }
        response = await inquirer.prompt(prompts) 

        
        let saveResult
        if (category=='department'){
            saveResult = await db.query(`INSERT INTO department VALUES(0, ?)`, response.department)
        }
        if (category=='role'){
            saveResult = await db.query(`INSERT INTO role VALUES (0,?,?,?)`, [response.role, response.salary, response.department])
        }
        if (category=='employee'){
            saveResult = await db.query( "INSERT INTO employee VALUES(0,?,?,?,? ) ", 
                [ 
                    response.first_name, response.last_name, 
                    response.role, response.manager 
                ] 
            )
        }
        console.log(chalk.blue(`New ${category} added.`))
        await subMenu(category)

    }
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

        response.action == 'exit' ? db.close() : await subMenu(response.action)

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
            console.log( chalk.yellow(`User updated.`))
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
            console.log( chalk.blue(`User added.`))
            await employeeMenu()

        }
    }
    

    // if( response.action=="employee" ){
        

        
    // }
    // if (response.action=='department'){

    // }
}
mainApp()