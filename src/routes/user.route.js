const express = require('express');
const router = express.Router();

const Support  = require('../models/support.model');

let auth  = require('../auth');

router.get('/', auth.authenticate, async(req, res)=> {
    const supports = await Support.find();
    res.json(auth.buildResponse(true, 'Support ticket loaded successfull', supports))
})

router.post('/raiseticket/:id', auth.authenticate, async(req, res, next) => {

    if (!auth.validateUserById(req)) {
        return res.status(400).send(auth.buildResponse(false, 'User id reference does not match access token!', null))
    }

    const user = req.user;

    if(!user || user == null){
        return res.status(400).send(auth.buildResponse(false, 'User not found!', null))
    }else{
        const support = new Support({
            title: req.body.title,
            desc: req.body.desc,
            owner: user
        })
        const newSupport = await support.save();

        if(!newSupport || newSupport == null){
            return res.status(400).send(auth.buildResponse(false, 'Support ticket could not be added', newSupport))
        }else{
            const supports = await Support.find({owner: user});
            return res.status(201).send(auth.buildResponse(true, 'Support ticket loaded successfull', supports))
        }
        
    }
})

router.get('/user/:id/tickets',  auth.authenticate, async(req, res, next) => {
    
    if (!auth.validateUserById(req)) {
        return res.status(400).send(auth.buildResponse(false, 'User id reference does not match access token!', null))
    }

    const user = req.user;

    if(!user || user == null){
        return res.status(400).send(auth.buildResponse(false, 'User not found!', null))
    }else{
        const supports = await Support.find({owner: user});
        return res.status(200).send(auth.buildResponse(true, 'Support ticket loaded successfull', supports))
    }
})

router.get('/user/:id/ticket/:ticketId',  auth.authenticate, async(req, res, next) => {
    
    if (!auth.validateUserById(req)) {
        return res.status(400).send(auth.buildResponse(false, 'User id reference does not match access token!', null))
    }

    // const user = await User.findOne({_id: req.params.id}, (err, rec)=>{
    //     if(err){
    //         return res.status(400).send(auth.buildResponse(false, 'Error loading role successfully', null))
    //     }
    // });
    const user = req.user;

    if(!user || user == null){
        return res.status(400).send(auth.buildResponse(false, 'User not found!', null))
    }else{
        const ticketId = req.params.ticketId;
        if(!ticketId || ticketId == null){
            return res.status(400).send(auth.buildResponse(false, 'Support ticket Id must be supplied and valid!', null))
        }
        const supports = await Support.findById({_id: ticketId}).populate('comments');

        return res.status(200).send(auth.buildResponse(true, 'Support ticket loaded successfully', supports));
    }
})

router.put('/user/:id/ticket/:ticketId',  auth.authenticate, async(req, res, next) => {
    
    if (!auth.validateUserById(req)) {
        return res.status(400).send(auth.buildResponse(false, 'User id reference does not match access token!', null))
    }

    const user = req.user;

    if(!user || user == null){
        return res.status(400).send(auth.buildResponse(false, 'User not found!', null))
    }else{
        const ticketId = req.params.ticketId;
        if(!ticketId || ticketId == null){
            return res.status(400).send(auth.buildResponse(false, 'Support ticket Id must be supplied and valid!', null))
        }else{

            let updatedSupport = {
                title : req.body.title,
                desc : req.body.desc,
                content : req.body.content
            };
            const support = await Support.findOneAndUpdate({_id: ticketId},  updatedSupport , (err)=>{
                if (err) {
                    return res.status(400).send(auth.buildResponse(false, 'Error loading support ticket by Id!', null))
                }
            }, {useFindAndModify: false});
    
            if (!support || support == null) {
                return res.status(400).send(auth.buildResponse(false, 'Support ticket not found!', null));
            }else{
                return res.status(200).send(auth.buildResponse(true, 'Support ticket updated successfully', support))
            }

        }

    }
})

router.delete('/user/:id/ticket/:ticketId',  auth.authenticate, async(req, res, next) => {
    
    if (!auth.validateUserById(req)) {
        return res.status(400).send(auth.buildResponse(false, 'User id reference does not match access token!', null))
    }

    const user = req.user;

    if(!user || user == null){
        return res.status(400).send(auth.buildResponse(false, 'User not found!', null))
    }else{
        const ticketId = req.params.ticketId;
        if(!ticketId || ticketId == null){
            return res.status(400).send(auth.buildResponse(false, 'Support ticket Id must be supplied and valid!', null))
        }
        
        const support = await Support.findOne({_id: ticketId}, (err)=>{
            if (err) {
                return res.status(400).send(auth.buildResponse(false, 'Error loading support ticket by Id!', null))
            }
        });

        if (!support || support == null) {
            return res.status(400).send(auth.buildResponse(false, 'Support ticket not found!', null));
        }else{

            const statusCheck = support.status;

            if (statusCheck && statusCheck == true) {
                return res.status(400).send(auth.buildResponse(false, 'You no longer have the permission to delete this ticket', null));
            }else{
                await Support.deleteOne({_id: support._id}, (err) =>{
                    if(err){
                        res.status(400).send(buildResponse(false, 'Error removing ticket: '+err, null))
                        next();
                    }
                });

                return res.status(200).send(auth.buildResponse(true, 'Support ticket deleted successfully', support))
            }
            
        }
        
    }
})
// add comment to ticket
router.post('/user/:id/ticket/:ticketId/comment',  auth.authenticate, async(req, res, next) => {
    
    if (!auth.validateUserById(req)) {
        return res.status(400).send(auth.buildResponse(false, 'User id reference does not match access token!', null))
    }

    const user = req.user;

    if(!user || user == null){
        return res.status(400).send(auth.buildResponse(false, 'User not found!', null))
    }else{

        const ticketId = req.params.ticketId;

        if(!ticketId || ticketId == null){
            return res.status(400).send(auth.buildResponse(false, 'Support ticket Id must be supplied and valid!', null))
        }
        
        const support = await Support.findOne({_id: ticketId}, (err)=>{
            if (err) {
                return res.status(400).send(auth.buildResponse(false, 'Error loading support ticket by Id!', null))
            }
        });

        if (!support || support == null) {
            return res.status(400).send(auth.buildResponse(false, 'Support ticket not found!', null));
        }else{

            const statusCheck = support.status;
            const processedStatusCheck = support.processedStatus;
            console.log('Ticket status check: ',statusCheck, processedStatusCheck);
            if (!statusCheck || statusCheck != true) {
                return res.status(400).send(auth.buildResponse(false, 'You are currently not permitted to add comment to this ticket', null));
            }else if(processedStatusCheck && processedStatusCheck == true){
                return res.status(400).send(auth.buildResponse(false, 'This ticket has been closed, please raise another ticket!', null));
            }
            else{
                // Add comment
                const userComment = req.body.comment;
                if (!userComment || userComment == null) {
                    return res.status(400).send(auth.buildResponse(false, 'Empty comments are not allowed', null));
                }
                const newComent = {comment: userComment};
                try {
                    const comment = await auth.addComment(support._id, newComent);
                    return res.status(200).send(auth.buildResponse(true, 'Support ticket comment added successfully', comment));
                } catch (error) {
                    res.status(500).send(auth.buildResponse(false, 'Error while adding comment to support ticket'+error, null))
                }
            }
            
        }
        
    }
})


module.exports = router