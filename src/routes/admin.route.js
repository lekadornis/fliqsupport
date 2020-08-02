const express = require('express');
const router = express.Router();

const Role  = require('../models/role.model');
const User  = require('../models/user.model');
const Support  = require('../models/support.model');

const RefreshToken = require('../models/refreshtoken.model');

let auth  = require('../auth');

router.get('/',(req, res)=> {
    
    res.json(auth.buildResponse(true, 'Admin management section!', null))
})

router.get('/roles', auth.authenticate, async(req, res, next)=> {
    try {

        let user = req.user;
        if (!auth.verifyRole(user, 'admin') || !auth.verifyRole(user, 'agent')) {
            return res.status(400).send(auth.buildResponse(false, 'Authorized access!!', null))
        }

        const roles = await Role.find();
        
        return res.status(200).send(auth.buildResponse(true, 'Roles loaded successfully', roles))

    } catch (error) {
        res.status(500).send(auth.buildResponse(false, 'An error occurred while validating request '+error, null));
    }
    
})

router.get('/role/:id', auth.authenticate, async(req, res, next)=> {
    try {
        let user = req.user;
        if (!auth.verifyRole(user, 'admin') || !auth.verifyRole(user, 'agent')) {
            return res.status(400).send(auth.buildResponse(false, 'Authorized access!!', null))
        }
        
        const role = await Role.find({_id: req.params.id}, (err, rec)=>{
            if(err){
                res.status(400).send(auth.buildResponse(false, 'Error loading role: '+err, null));
            }
        });
        
        if(!role || role == null){
            return res.status(400).send(auth.buildResponse(false, 'Role not found!', null))
        }else{
            return res.status(200).send(auth.buildResponse(true, 'Role loaded successfully', role));
        }
        

    } catch (error) {
        res.status(500).send(auth.buildResponse(false, 'An error occurred while validating request '+error, null));
    }
})

router.delete('/role/:id', auth.authenticate, async(req, res, next)=> {
    try {

        let user = req.user;
        if (!auth.verifyRole(user, 'admin')) {
            return res.status(400).send(auth.buildResponse(false, 'Authorized access!!', null))
        }

        const role = await Role.findById(req.params.id, (err, rec) => {
            if(err){
                console.log('Error: '+err);
                res.status(400).send(auth.buildResponse(false, 'Error deleting role'+err, null));
                next();
            }
            return rec;            
        });

        if(!role || role == null){
            res.status(400).send(auth.buildResponse(false, 'Role not found!', null));
            next();
        }
        await Role.deleteOne({_id: req.params.id}, (err) =>{
            if(err){
                return res.status(400).send(auth.buildResponse(false, 'Error removing role: '+err, null))
            }

            return res.status(200).send(auth.buildResponse(true, 'Role deleted successfully', null))
        });
        
    } catch (error) {
        res.status(500).send(auth.buildResponse(false, 'An error occurred while processing request '+error, null));
    }
    
})

router.post('/addrole', auth.authenticate, async(req, res, next)=>{
    
    
    const role = new Role({
        name: req.body.name,
        desc: req.body.desc
    })

    try {
        const roleName = req.body.name;
        if(roleName !== 'admin'){
            let user = req.user;
            if (!auth.verifyRole(user, 'admin') ) {
                return res.status(400).send(auth.buildResponse(false, 'Authorized access!!', null))
            }
        }
        const checkRec = await Role.find({name: roleName}, (err, rec) =>{
            if(err){
                res.status(400).send(auth.buildResponse(false, 'An error occurred while validating request '+err, null));
                next();
            }
        })
        if (checkRec && checkRec != null) {
            return res.status(400).send(auth.buildResponse(false, 'Role already exist ', null));
        }else{
            const newRec = await role.save();
            return res.status(200).send(auth.buildResponse(true, 'Role added successfully', newRec))
        }

    } catch (error) {
        res.status(500).send(auth.buildResponse(false,'UnExpected error occurred: '+error, null));
    }
});

//Tokens Refresh token
// Get users
router.get('/refreshtokens', auth.authenticate, async(req, res, next)=> {
    try {
        let user = req.user;
        if (!auth.verifyRole(user, 'admin') ) {
            return res.status(400).send(auth.buildResponse(false, 'Authorized access!!', null))
        }
        const refreshTokens = await RefreshToken.find();
        
        res.status(200).send(auth.buildResponse(true, 'Tokens loaded successfully', refreshTokens))

    } catch (error) {
        res.status(500).send(auth.buildResponse(false, 'An error occurred while validating request '+error, null));
    }
    
})

//Internal User management
// Admin new user
router.post('/adduser', auth.authenticate, async(req, res, next)=>{
    
    try {
        let user = req.user;
        if (!auth.verifyRole(user, 'admin') ) {
            return res.status(400).send(auth.buildResponse(false, 'Authorized access!!', null))
        }

        const roleId = req.body.roleId;
        const email = req.body.email;
        
        const checkRole = await Role.findOne({_id: roleId}, (err, rec)=>{
            if(err){
                res.status(400).send(auth.buildResponse(false, 'An error occurred while validating request '+err, null));
                next();
            }
            if(!rec || rec == null){
                res.status(400).send(auth.buildResponse(false, 'Role doesnt exist ', null));
                next();
            }
        })
        const checkUserRec = await User.findOne({email: email}, (err, rec)=>{
            if(err){
                res.status(400).send(auth.buildResponse(false, 'An error occurred while validating request '+err, null));
                next();
            }
            if(rec){
                res.status(400).send(auth.buildResponse(false, 'User with same email address already exist ', null));
                next();
            }
        })

        if(checkUserRec || checkUserRec != null){
            res.status(400).send(auth.buildResponse(false, 'User with same email address already exist ', null));
        }else{
            const pwd = require('crypto').randomBytes(64).toString('hex').substring(0,20);
            console.log('Default password: '+pwd);
            const newRec =  User.create({
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                password: auth.hashPassword(pwd),
                email: req.body.email,
                role: checkRole
            })

            //const newRec = await user.save();
    
            res.status(200).send(auth.buildResponse(true, 'User added successfully', newRec))
        }

    } catch (error) {
        res.status(500).send(auth.buildResponse(false,'UnExpected error occurred: '+error, null));
    }
});
// Get users
router.get('/users', auth.authenticate, async(req, res, next)=> {
    try {
        let user = req.user;
        if (!auth.verifyRole(user, 'admin') || !auth.verifyRole(user, 'agent')) {
            return res.status(400).send(auth.buildResponse(false, 'Authorized access!!', null))
        }
        const users = await User.find();
        
        res.status(200).send(auth.buildResponse(true, 'Users loaded successfully', users))

    } catch (error) {
        res.status(500).send(auth.buildResponse(false, 'An error occurred while validating request '+error, null));
    }
    
})
//Get User details by Id
router.get('/user/:id', auth.authenticate, async(req, res, next)=> {
    try {
        let user = req.user;
        if (!auth.verifyRole(user, 'admin') || !auth.verifyRole(user, 'agent')) {
            return res.status(400).send(auth.buildResponse(false, 'Authorized access!!', null))
        }
        const userProfile = await User.findOne({_id: req.params.id}, (err, rec)=>{
            if(err){
                return res.status(400).send(auth.buildResponse(false, 'Error loading role successfully', null))
            }
        });

        if(!userProfile || userProfile == null){
            return res.status(400).send(auth.buildResponse(false, 'User not found!', null))
        }else{
            return res.status(200).send(auth.buildResponse(true, 'User loaded successfully', userProfile));
        }
        

    } catch (error) {
        res.status(500).send(auth.buildResponse(false, 'An error occurred while validating request '+error, null));
    }
})
//Update user password
router.put('/updatepassword/:id', async(req, res, next)=> {
    try {
        
        const newPwd = req.body.pwd;
        const comPwd = req.body.comparePwd;

        if (!newPwd || !comPwd) {
            return res.status(400).send(auth.buildResponse(false, 'Password and compare password string must be supplied!', null))
        }
        if (newPwd != comPwd) {
            return res.status(400).send(auth.buildResponse(false, 'Password and compare must be same!', null))
        }
        const encryptedPwd = auth.hashPassword(newPwd);
        const user = await User.findOneAndUpdate({_id: req.params.id}, {password: encryptedPwd}, (err, rec)=>{
            if(err){
                return res.status(400).send(auth.buildResponse(false, 'Error loading updating user password!', null))
            }
        }, {useFindAndModify: false});

        if(!user || user == null){
            res.status(400).send(auth.buildResponse(false, 'User profile not found!', null))
        }else{
            res.status(200).send(auth.buildResponse(true, 'User password updated successfully', user));
        }
        

    } catch (error) {
        res.status(500).send(auth.buildResponse(false, 'An error occurred while processing request '+error, null));
    }
})
//Gets users by role
router.get('/usersbyrole/:id', auth.authenticate, async(req, res, next)=> {
    try {
        let user = req.user;
        if (!auth.verifyRole(user, 'admin') && !auth.verifyRole(user, 'agent')) {
            return res.status(400).send(auth.buildResponse(false, 'Authorized access!!', null))
        }
        const roleId = req.params.id;
        const checkRole = await Role.findOne({_id: roleId}, (err, rec)=>{
            if(err){
                res.status(400).send(auth.buildResponse(false, 'An error occurred while validating request '+err, null));
                next();
            }
        })
        if (!checkRole && checkRole == null) {
            return res.status(400).send(auth.buildResponse(false, 'Role doesnt exist ', null));
        }

        const users = await User.find({role: checkRole});
        
        res.status(200).send(auth.buildResponse(true, 'Users loaded successfully', users))

    } catch (error) {
        res.status(500).send(auth.buildResponse(false, 'An error occurred while validating request '+error, null));
    }
    
})

// Remove a user
router.delete('/user/:id', auth.authenticate, async(req, res, next)=> {
    try {
        let user = req.user;
        if (!auth.verifyRole(user, 'admin')) {
            return res.status(400).send(auth.buildResponse(false, 'Authorized access!!', null))
        }
        const userProfile = await User.findById(req.params.id, (err, rec) => {
            if(err){
                return res.status(400).send(buildResponse(false, 'Error deleting user'+err, null));
            }          
        });

        if(!userProfile || userProfile == null){
            return res.status(400).send(buildResponse(false, 'User not found!', null));
        }
        await User.deleteOne({_id: req.params.id}, (err) =>{
            if(err){
                return res.status(400).send(buildResponse(false, 'Error removing user: '+err, null))
            }
        });
        returnres.status(200).send(buildResponse(true, 'User deleted successfully', null))
        
    } catch (error) {
        res.status(500).send(buildResponse(false, 'An error occurred while processing request '+error, null));
    }
    
})
//Load users tickets
router.get('/user/:id/tickets',  auth.authenticate, async(req, res, next) => {
    
    let user = req.user;
    if (!auth.verifyRole(user, 'admin') && !auth.verifyRole(user, 'agent')) {
        return res.status(400).send(auth.buildResponse(false, 'Authorized access!!', null))
    }
    const userProfile = await User.findById(req.params.id, (err, rec) => {
        if(err){
            return res.status(400).send(buildResponse(false, 'Error deleting user'+err, null));
        }          
    });

    if(!userProfile || userProfile == null){
        return res.status(400).send(auth.buildResponse(false, 'User not found!', null))
    }else{
        const supports = await Support.find({owner: userProfile});
        return res.status(200).send(auth.buildResponse(true, 'Support ticket loaded successfull', supports))
    }
})

//Load users full ticket details
router.get('/user/:id/ticket/:ticketId',  auth.authenticate, async(req, res, next) => {
    
    let user = req.user;
    if (!auth.verifyRole(user, 'admin') && !auth.verifyRole(user, 'agent')) {
        return res.status(400).send(auth.buildResponse(false, 'Authorized access!!', null))
    }
    const userProfile  = await User.findById(req.params.id, (err, rec) => {
        if(err){
            return res.status(400).send(buildResponse(false, 'Error deleting user'+err, null));
        }          
    });

    if(!userProfile || userProfile == null){
        return res.status(400).send(auth.buildResponse(false, 'User not found!', null))
    }else{
        const ticketId = req.params.ticketId;
        if(!ticketId || ticketId == null){
            return res.status(400).send(auth.buildResponse(false, 'Support ticket Id must be supplied and valid!', null))
        }
        try {
            const support = await Support.findById({_id: ticketId}).populated;
            return res.status(200).send(auth.buildResponse(true, 'Support ticket loaded successfully', support))
        } catch (error) {
            res.status(500).send(auth.buildResponse(false, 'An error occurred: '+error, null));
        }
    }
})

//Load tickets
router.get('/tickets',  auth.authenticate, async(req, res, next) => {
    let user = req.user;
    if (!auth.verifyRole(user, 'admin') && !auth.verifyRole(user, 'agent')) {
        return res.status(400).send(auth.buildResponse(false, 'Authorized access!!', null))
    }
    const supports = await Support.find();
    return res.status(200).send(auth.buildResponse(true, 'Support ticket loaded successfull', supports))
})

//Load tickets full details
router.get('/ticket/:ticketId',  auth.authenticate, async(req, res, next) => {
    
    let user = req.user;
    if (!auth.verifyRole(user, 'admin') && !auth.verifyRole(user, 'agent')) {
        return res.status(400).send(auth.buildResponse(false, 'Authorized access!!', null))
    }

    const ticket = req.params.ticketId;
    if (!ticket) {
        return res.status(400).send(auth.buildResponse(false, 'Support Ticket Id must be supplied!', null))
    }
    try {
        const support = await Support.findById({_id: ticket}).populate('comments');
        return res.status(200).send(auth.buildResponse(true, 'Support ticket loaded successfully', support))
    } catch (error) {
        res.status(500).send(auth.buildResponse(false, 'An error occurred: '+error, null));
    }
})

//Update ticket processed status
router.put('/ticket/:ticketId/status/:st',  auth.authenticate, async(req, res, next) => {
    
    let user = req.user;
    if (!auth.verifyRole(user, 'admin') && !auth.verifyRole(user, 'agent')) {
        return res.status(400).send(auth.buildResponse(false, 'Authorized access!!', null))
    }
    const ticket = req.params.ticketId;
    const status = req.params.st;
    //console.log(ticket, status);

    if (!ticket || !(status)) {
        return res.status(400).send(auth.buildResponse(false, 'Support TicketId and process status (true/false) must be valid!', null))
    }
    try {
        const support = await Support.findOneAndUpdate({_id: ticket},{processedStatus: status}, (err, sup)=>{
            if (err) {
                return res.status(400).send(auth.buildResponse(false, 'Error updating ticket processed status'+err, null))
            }
        }, {useFindAndModify: false})
        return res.status(200).send(auth.buildResponse(true, 'Support ticket updated successfully', support))
    } catch (error) {
        res.status(500).send(auth.buildResponse(false, 'An error occurred: '+error, null));
    }
})

// Add comment to support ticket
router.post('/ticket/:ticketId/comment',  auth.authenticate, async(req, res, next) => {
    let user = req.user;
    if (!auth.verifyRole(user, 'admin') && !auth.verifyRole(user, 'agent')) {
        return res.status(400).send(auth.buildResponse(false, 'Authorized access!!', null))
    }

    const ticket = req.params.ticketId;
    if (!ticket) {
        return res.status(400).send(auth.buildResponse(false, 'Support Ticket Id must be supplied!', null))
    }
    const support = await Support.findOne({_id: ticket}, (err)=>{
        if (err) {
            return res.status(400).send(auth.buildResponse(false, 'Error loading support ticket by Id!', null))
        }
    });

    if (!support || support == null) {
        return res.status(400).send(auth.buildResponse(false, 'Support ticket not found!', null));
    }else{

         // Add comment
         const comment = req.body.comment;
         const status = true;
         const userComment = {comment, status}

         if (!userComment || userComment == null) {
             return res.status(400).send(auth.buildResponse(false, 'Empty comments are not allowed', null));
         }
         try {

             const addComment = await auth.addComment(support._id,userComment);
             if (addComment && addComment != null) {
                 support.status = true;
                 support.save();
             }
             return res.status(200).send(auth.buildResponse(true, 'Support ticket comment added successfully', addComment));
         } catch (error) {
             res.status(500).send(auth.buildResponse(false, 'Error while adding comment to support ticket', null))
         }    
    }

    
})
//Load ticket in date range
router.post('/search/ticket',  auth.authenticate, async(req, res, next) => {
    
    let user = req.user;
    if (!auth.verifyRole(user, 'admin') && !auth.verifyRole(user, 'agent')) {
        return res.status(400).send(auth.buildResponse(false, 'Authorized access!!', null))
    }
    let startDate = req.body.startDate;
    let endDate = req.body.endDate;

    if(startDate === '' || endDate === '') {
        return res.status(400).send(auth.buildResponse(false, 'StartDate and EndDate must be supplied!', null))
    }
    try {
        const startDateTime = new Date(new Date(startDate));
        const endDateTime = new Date(new Date(endDate).setHours(23,59,59));
        console.log(startDateTime, endDateTime);
        const supports = await Support.find({ 
            'createAt': {
                    $gte: startDateTime,
                    $lt: endDateTime 
                }
            }).sort({ createAt: 'desc'});
        console.log('Supoort from search',supports);
        if (!supports || !supports.length) {
            return res.status(400).send(auth.buildResponse(false, 'Record not found within StartDate and EndDate range', null))
        }else{
            return res.status(200).send(auth.buildResponse(true, 'Support ticket loaded successfully', supports))
        }

    } catch (error) {
        res.status(500).send(auth.buildResponse(false, 'An error occurred: '+error, null));
    }
})

module.exports = router;