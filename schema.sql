CREATE DATABASE cms;

USE cms;

DROP TABLE department;
DROP TABLE role;
DROP TABLE employee;

CREATE TABLE department (
id INTEGER AUTO_INCREMENT PRIMARY KEY,
title VARCHAR(30)
);

CREATE TABLE role (
id INTEGER AUTO_INCREMENT PRIMARY KEY,
title VARCHAR(30),
salary DECIMAL,
department_id INTEGER
);

CREATE TABLE employee (
id INTEGER AUTO_INCREMENT PRIMARY KEY,
first_name VARCHAR(30),
last_name VARCHAR(30),
role_id INTEGER,
manager_id INTEGER
);

INSERT INTO department VALUES(0, 'Web Dev');
INSERT INTO department VALUES(0, 'Sales');

INSERT INTO role VALUES(0, 'Junior Developer', 20000.00, 1);
INSERT INTO role VALUES(0, 'Senior Developer', 50000.00, 1);
INSERT INTO role VALUES(0, 'SEO Consultant', 40000.00, 2);
INSERT INTO role VALUES(0, 'Marketer', 30000.00, 2);

INSERT INTO employee VALUES(0, 'Akane', 'Arbuckle', 1, 2);
INSERT INTO employee VALUES(0, 'Bertilla', 'Benson', 2, null);
INSERT INTO employee VALUES(0, 'Carlos', 'Carrie', 3, 4);
INSERT INTO employee VALUES(0, 'Diana', 'Dennise', 4, null);
