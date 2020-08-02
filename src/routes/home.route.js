const express = require('express');
const router = express.Router();

const Role  = require('../models/role.model');
const User  = require('../models/user.model');
const Support  = require('../models/support.model');
const Comments  = require('../models/comments.model');
const RefreshToken  = require('../models/refreshtoken.model');

const auth  = require('../auth');

router.get('/', async(req, res)=> {
    res.json(auth.buildResponse(true, 'Welcome to FliqPay Ticketing System', supports))
})

router.post('/login', async(req, res, next)=> {
    try {
        
        const email = req.body.username;
        
        const checkUserRec = await User.findOne({email: email}, (err, rec)=>{
            if(err){
                return res.status(400).send(auth.buildResponse(false, 'An error occurred while processing request '+err, null));
            }
        }).populate('role');
    
        if(!checkUserRec || checkUserRec === null){
            return res.status(400).send(auth.buildResponse(false, 'Login failed: User not found', null));
        }else{

            const pwd = req.body.password;
            
            if(auth.validatePassword(pwd, checkUserRec.password)){
                const token = auth.sign(checkUserRec);
                const refreshToken = auth.refreshToken(checkUserRec);
                const tokenObj = {token, refreshToken};

                return res.status(200).send(auth.buildResponse(true, 'Login successful', tokenObj));

            }else{
                return res.status(200).send(auth.buildResponse(false, 'Login failed: Invalid username and password!!', null))
            }

        }

    } catch (error) {
        res.status(500).send(auth.buildResponse(false,'UnExpected error occurred: '+error, null));
    }
    
})

router.post('/register', async(req, res, next)=> {
    try {
        
        const email = req.body.email;
        const checkRec = await Role.findOne({name: 'agent'}, (err, rec)=>{
            if(err){
                return res.status(400).send(auth.buildResponse(false, 'An error occurred while processing your request '+err, null));
            }
            if(!rec || rec == null){
                return res.status(400).send(auth.buildResponse(false, 'Error while processing request, contact admin ', null));
            }
        })
        const checkUserRec = await User.findOne({email: email}, (err, rec)=>{
            if(err){
                return res.status(400).send(auth.buildResponse(false, 'An error occurred while processing request '+err, null));
            }
        })

        if(checkUserRec || checkUserRec != null){
            return res.status(400).send(auth.buildResponse(false, 'User with same email address already exist ', null));
        }else{

            if(!auth.validateUser(req)){
                return res.status(400).send(auth.buildResponse(false, 'All required fields must be supplied! ', null));
            }else{

                const newRec = await User.create({
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    email: req.body.email,
                    password: auth.hashPassword(req.body.password),
                    role: checkRec
                });
                
                return res.status(200).send(auth.buildResponse(true, 'Registration is successful', newRec))
            }
        }

    } catch (error) {
        res.status(500).send(auth.buildResponse(false,'UnExpected error occurred: '+error, null));
    }
    
})

router.post('/token', async(req, res, next)=> {
    try {
        
        const token = req.body.token;
        if (token == null) return res.status(401).send(auth.buildResponse(false,'Refresh token must be supplied!', null));

        const refreshToken = RefreshToken.findOne({token: token}, (err, tok)=>{
            if (err) {
                return res.status(401).send(auth.buildResponse(false,'Error loading refresh token', null));
            }
        });
        console.log('Token: ', refreshToken)
        if (!refreshToken) {
            return res.status(401).send(auth.buildResponse(false,'Token not found!', null));
        }
        const user = auth.userFromRefreshToken(refreshToken.token);
        if(!user) return res.status(401).send(auth.buildResponse(false,'Invalid Token supplied!', null));

        const newToken = auth.sign(user);
        const newRefreshToken = auth.signRefreshToken(user)
        const tokenObj = {token:newToken, refreshToken: newRefreshToken};

        return res.status(200).send(auth.buildResponse(true, 'New token supplied', tokenObj));

    } catch (error) {
        res.status(500).send(auth.buildResponse(false,'UnExpected error occurred: '+error, null));
    }
    
})

module.exports = router