# Codebase Architecture

This project uses the MVC framework, and the database I am using is MongoDB.

## Code Structure

**Model:** MonogoDB models defeind in this folder.<br/>
**Controllers:** The actually logic of how we interact with the db and how the response is built are implemented here.<br/>
**Routes:** Defined the flow of the route, what middlewares they consist is defined here.<br/>
**Helpers:** logger.js, OperationalErr.js, QueryStringHandler.js etc.<br/>
**Utils:** code snippets that we used to make code cleaner. example: withCatchErrorAsync.js<br/>
**Config:** config.env / database.js / AWS.js configuration saved here<br/>
**app.js:** Global middlewares for example helmet (set security HTTP headers) or express-rate-limit (limit rate of request of the same IP address can send to our API) are defined here.<br/>
**server.js:** Actual place to start our backend, we connect our db and listen for request from here.<br/>
**test.js** Being used to test the reply comment notification, implemented with socket.io.<br/>

![GitHub Logo](/readMe/code_structure.png) 


## Error Management

Focal Point:<br/>
**1.** Errors being splitted into two types, isOperational / notOperational (unknown).

isOperational means the error that we can identified so they are operational **(controlled)**, I create a custom error with message for this type of error using my OperationalErr error class.
notOperational errs are the err that happens out of anticipation **(not controlled)**, I create a error for these kind of errs in the GlobalErrorController, **please check focal point 2.**
   
**2.** The error message differs base on what environment we are in. **(development / production)**

**Errors are handled differently in the globalErrController.js**

**For development:** We don't filter the errors details, since we need every details of the error for debugging, we may have other logging mechanism to make it easier to track.

**For production:** We only expose resonable amount of error details for the users.

**Note:** Errors from MongoDB or other external packages will be customized in the globalErrController.js to unite the error message structure.

![GitHub Logo](/readMe/error_handling.png) 


## Data Modeling
Please check the video for explanation.</br>
![GitHub Logo](/readMe/datamodeling.png) 

