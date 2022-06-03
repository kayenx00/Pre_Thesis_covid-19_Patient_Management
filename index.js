// import library

const mysql = require('mysql2');
const express = require('express');
const session = require('express-session');
const path = require('path');
const alert = require('alert');
const ejs = require('ejs');
const { request } = require('http');

// view engine setup



//const connection = require('./db/db');

// set up

const connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'root',
	password : 'Nguyenlong09102014',
	database : 'Covid - 19 Patient management'
});

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.engine('ejs', require('ejs').__express);
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'static')));

//Register section 
app.get('/register', function(request, response) {
	// Render Register template
	response.sendFile(path.join(__dirname + '/view/register.html'));
});
app.post('/reAuth', function(request, response) {
	// Capture the input fields
	let username = request.body.username;
	let password = request.body.password;
	let email = request.body.email;
	// Ensure the input fields exists and are not empty
	if (username && password && email) {
		// Execute SQL query that'll query whole Users table 
		connection.query('SELECT * FROM Users WHERE User_name = ?', [username], function(error, results, fields) {
			// If there is an issue with the query, output the error
			if (error) throw error;
			// If the account exists
			if (results.length > 0) {
				// Authenticate the user
				alert("Username already exist");
				// Redirect to home page
				response.redirect('../register');
			}
			else {
				request.session.username = username; 
				connection.query("INSERT INTO Users(User_name, User_password, User_email, User_type) values(?,?,?,'Patient')", [username, password, email], function(error, results, fields){
					if(error) throw error;
				
					else{
						alert("Register successfull");
						connection.query("INSERT INTO Patient(Patient_Account) values (?)", [username], function(error, results, fields){
							if (error) throw error;
							response.redirect('../getmoreinformation');
						});
				}});
			}
	}); 
}});
app.get('/getmoreinformation', function(request, response){
	response.sendFile(path.join(__dirname + '/view/newInfo.html'));
});
app.post('/addmoreinformation', function(request, response) {
	// Capture the input fields
	username = request.session.username;
	let fullname = request.body.fullname;
	let patientID = request.body.patientID;
	let email = request.body.email;
	let phone = request.body.phone;
	let city = request.body.city;
	let district = request.body.district;
	// Ensure the input fields exists and are not empty
	if (fullname && patientID && email && phone && city && district) {
		// Execute SQL query that'll 
			connection.query('Update Patient SET Patient_name = ? , Patient_ID = ? , email = ? , phone = ? , city = ?, district = ? where Patient_Account = ?', [fullname, patientID, email, phone, city, district, username], function(error, results, fields){
				if(error) throw error;
				else{
					alert("Update your information successfull");
					response.redirect('../');
				}});}
	});

// Login section
// Login will define the user type then redirect to corresponding section

app.get('/', function(request, response) {
	// Render login template
	response.sendFile(path.join(__dirname + '/view/login.html'));
});

app.post('/auth', function(request, response) {
	// Capture the input fields
	let username = request.body.username;
	let password = request.body.password;
	// Ensure the input fields exists and are not empty
	if (username && password) {
		// Execute SQL query that'll select the account from the database based on the specified username and password
		connection.query('SELECT * FROM Users WHERE User_name = ? AND User_password = ?', [username, password], function(error, results, fields) {
			// If there is an issue with the query, output the error
			if (error) throw error;
			// If the account exists
			if (results.length > 0) {
				// Authenticate the user
				request.session.loggedin = true;
				request.session.username = username;
				connection.query('SELECT User_type from Users where User_name = ?', [username], function(error, results, fields){
					if (error) throw error;
					let string = results[0].User_type;
					console.log(string);
					// response.redirect('../home');
					if (string == 'Patient'){
						response.redirect('../patientView');
					}
					else if (string == 'Doctor'){
						response.redirect('../doctorView');
					}
					
					else if (string == 'Admin'){
						response.redirect('../addDoctor');
					}
				})
				// Redirect to home page
				// response.redirect('../home');
			} else {
				alert("Incorrect Username and/or Password!");
				response.redirect('../');
			}			
			//response.end();
		});
	} else {
		response.send('Please enter Username and Password!');
		//response.end();
	}
});

// Patient section
// another routes also appear here
app.get('/patientView', function(request, response, next) {
    
	if (request.session.loggedin){
		let username = request.session.username;
		console.log(username);
        // this script to fetch data from MySQL databse table
		connection.query('SELECT Patient_Name, Patient_ID, email, phone, city, district, Chosen_Doctor FROM Patient where Patient_Account = ?',[username], function (err, data, fields) {
			if (err) throw err;
			else {
				request.session.username = username;
				console.log(data);
				response.render('patientView', { title: 'patientView', userData: data})};
	  });
	}
	else {
		// Not logged in
		response.send('Please login to view this page!');
	}
	

});
app.get('/viewDoctor', function(request, response, next){
	connection.query('SELECT * FROM Doctor', function(err, data, fields){
		if(err) throw err;
		else{
			console.log(data);
			response.render('viewDoctor', {title: 'viewDoctor', userData: data})
		};
	});
});

app.get('/registerDoctor', function(request, response){
	response.sendFile(path.join(__dirname + '/view/Doctor_Register.html'));
});

app.post('/RegisterDoctor', function(request, response){
	let Doctor_ID = request.body.Doctor_ID;
	let username = request.session.username; 
	console.log(username);
	if(request.body.Doctor_ID){
		connection.query('Update Patient set Chosen_Doctor = ? WHERE Patient_Account = ? ', [Doctor_ID, username], function(err, results, fileds) {
			if(err) throw err; 
			response.redirect('/patientView');
		})
	}
});

app.get('/healthDeclare', function(request, response){
	response.sendFile(path.join(__dirname + '/view/Health_Declaration.html'));
});

app.post('/Health_Declare', function(request, response){
	let username = request.session.username;
	let Blood_Pressure = request.body.Blood_Pressure;
	let Oxygen_level = request.body.Oxygen_level;
	let Other_Diagnose = request.body.Other_Diagnose;
	if(Blood_Pressure && Oxygen_level && Other_Diagnose){
		connection.query('SELECT ID as Patient_ID FROM Patient where Patient_Account = ?', [username], function(err, results, fields){
			if(err) throw err;
			else{
				let Patient_ID = results[0].Patient_ID;
				let ts = Date.now();
				let date_ob = new Date(ts);
				let date = date_ob.getDate();
				let month = date_ob.getMonth() + 1;
				let year = date_ob.getFullYear();
				let full_Date = year + "-" + month + "-" + date;
				// prints date & time in YYYY-MM-DD format
				console.log(full_Date);	
				connection.query('INSERT INTO Health_Information(Patient_ID, Blood_Pressure, Oxygen_level, Other_Diagnose, last_update) values (?,?,?,?,?)', [Patient_ID, Blood_Pressure, Oxygen_level, Other_Diagnose, full_Date], function(err, results, fileds){
					if(err) throw err;
					console.log(results);
					response.redirect('/patientView');
				});
				}

		});
	}
});

// Doctor section 

app.get('/doctorView', function(request, response, next){
	if(request.session.loggedin){
		let username = request.session.username;
		console.log(username);
        // this script to fetch data from MySQL databse table
		connection.query('SELECT Doctor_name, Doctor_email, Doctor_phone FROM Doctor where Doctor_Account = ?',[username], function (err, data, fields) {
			if (err) throw err;
			else {
				request.session.username = username;
				console.log(data);
				response.render('doctorView', { title: 'doctorView', userData: data})};
	  });
	}
	else {
		// Not logged in
		response.send('Please login to view this page!');
	}

});

app.get('/viewPatientDeclaration', function(request, response, next){
	let username = request.session.username;
	connection.query('SELECT ID as Doctor_ID FROM Doctor where Doctor_Account = ?', [username], function(err, results, fields){
		if(err) throw err;
		else{
			let ID = results[0].Doctor_ID;
			connection.query('SELECT h.Patient_ID, p.Patient_Name, h.Blood_Pressure, h.Oxygen_level, h.Other_Diagnose, h.last_update from Patient p, Health_Information h where h.Patient_ID = p.ID and p.Chosen_Doctor = ? Order by h.Patient_ID DESC, p.Patient_Name DESC, h.last_update ASC', [ID], function(err, data, next){
				console.log(data);
				response.render('viewPatientDeclaration', { title: 'viewPatientDeclaration', userData: data});
			});
		}
	});
});


// Admin section

app.get('/addDoctor', function(request, response) {
	// If the user is loggedin
	if (request.session.loggedin) {
        //render the addDoctor.html
        response.sendFile(path.join(__dirname + '/view/addDoctor.html'));

	} else {
		response.send('Please login to view this page!');
	}
	//response.end();
});

app.post('/adddoctor', function(request, response){
	let Dusername = request.body.Dusername;
	let Dpassword = request.body.Dpassword;
	let Demail = request.body.Demail;
	let doctorName = request.body.doctorName;
	let doctorPhone = request.body.doctorPhone;

	if(Dusername && Dpassword && Demail && doctorName && doctorPhone){
		connection.query("INSERT INTO Users(User_name, User_password, User_email, User_type) values (?,?,?,'Doctor')", [Dusername, Dpassword, Demail], function(error, results, fileds){
			if (error) {throw error;
			console.log(results);}
			else {
				connection.query('INSERT INTO Doctor(Doctor_name, Doctor_email, Doctor_phone, Doctor_Account) values (?,?,?,?)', [doctorName, Demail, doctorPhone, Dusername], function(error, results, fileds){
					if (error) throw error;
					else {
						alert('Add doctor successfully');
						response.redirect('../addDoctor');
					}
				});
			}
		});

	}
});










app.get('/home', function(request, response) {
	// If the user is loggedin
	if (request.session.loggedin) {
		// Output username
		response.send('Welcome back, ' + request.session.username + '!');
	} else {
		// Not logged in
		response.send('Please login to view this page!');
	}
	response.end();
});

app.listen(4000);
