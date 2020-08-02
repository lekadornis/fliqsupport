const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
let response = require('./constants/response');

const RefreshToken = require('./models/refreshtoken.model');
const User  = require('./models/user.model');
const Comments  = require('./models/comments.model');
const Support  = require('./models/support.model');

const saltRounds = 10;

const signAuthToken = function(user){
    //console.log('User details: '+user);
    const userDetails = {user};
    return jwt.sign(userDetails,  process.env.AUTH_SECRET_KEY, {expiresIn: '120m'});

}

const signRefreshToken = function(user){
    const userDetails = {user};
    const refToken = jwt.sign(userDetails,  process.env.REFRESH_TOKEN_KEY);
    const tokenUpdate = RefreshToken.findOneAndUpdate({user: user}, {token: refToken}, (err, rec)=>{
        if (err) {
            return null;
        }
    }, {useFindAndModify: false});

    if (!tokenUpdate || tokenUpdate == null) {
        console.log('Creating refresh token');
        const newRefreshToken = RefreshToken.create({token: refToken});
        console.log('Refresh token', newRefreshToken);
    }
    return refToken;
}

const hashPassword = function (password){
    // Changed to SYNC
    // bcrypt.hash(password, salt, (err, hash) => {
    //     if (err) {
    //         console.log(err);
    //     }
    //     console.log('Internal hash: '+hash);
    // });

    return bcrypt.hashSync(password, saltRounds);
}
const compareHashPassword = function(password, hash){
    // Changed to SYNC
    // bcrypt.compare(password, hash, function(err, res) {
    //     if(err){
    //         return false;
    //     }
    //     return res;
    // });
    return bcrypt.compareSync(password, hash);
}
const validateUserById = function(req){
    const userId = req.params.id;
    const user = req.user;
    //console.log(userId, user);
    if (!userId || !user) {
        return false;
    }
    
    if(userId !== user._id){
        return false;
    }
    return true;
}
const validateUser = function(req){
    const firstName = req.body.firstName;
    const lastName =  req.body.lastName;
    const email = req.body.email;

    if(!firstName || firstName == null){
        return false;
    }
    if(!lastName || lastName == null){
        return false;
    }
    if(!email || email == null){
        return false;
    }
    return true;
}

const authenticateToken = function(req,res, next){
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if(token == null) return res.status(400).send({message: 'UnAuthorized access: No access token', status: '09'});

    jwt.verify(token, process.env.AUTH_SECRET_KEY, (err, user)=> {
        if (err) {
            return res.status(400).send({message: 'Authorized access: Invalid access token.', status: '09'});
        }
        req.user = user.user;
        //console.log(req.user);
        next();
    })
}

const authenticateUserByRole = function(user, roleName){
    validateByRole(user, roleName)
    .then((status)=>{
        console.log(status);
        return status
    }, (err)=> {console.log('RoleCheck error: ',err)});
    //return roleStatus;
}

const authenticateUserRole = function(user, roleName){
    if (!user) {
        return false;
    }
    const role = user.role.name;
    if (!role) {
        return false;
    }
    if (role !== roleName) {
        return false;
    }
    return true;
}

const validateByRole = async function (user,roleName){
    let userId  = user._id;
    const userDetails = await User.findOne({_id: userId}, (err)=>{
        if (err) {
            console.log('Error loading user while validating admin access role');
            return false;
        }
    }).populate('role');
    //console.log('User Details: ',userDetails);
    if (!userDetails || userDetails == null) {
        console.log('User details not found while authenticating user by role!');
        return false;
    }else {
        let userRole = userDetails.role;
        let rName = userRole.name
        console.log('Role name: ', rName, roleName);
        if(!userRole || userRole == null){
            console.log('Role not found!')
            return false;
        }else if(!rName || (rName != roleName)){
           console.log('Role name doesnt match!');
            return false;
        }else{
            return true;
        }
    }
}

const getUserFromToken = function(token){
    return jwt.verify(token, process.env.AUTH_SECRET_KEY, (err, user)=> {
        if (err) {
            console.log('Error fetching/validating refresh token');
            return null;
        }
        return user;
    })
}

const getUserFromRefreshToken = function(token){
    //console.log('Token: ', token);
    return jwt.verify(token, process.env.REFRESH_TOKEN_KEY, (err, user)=> {
        if (err) {
            console.log('Error fetching/validating refresh token');
            return null;
        }
        console.log('User from token', user);
        return user;
    })
}

const createComment = function(supportId, comment) {
    return Comments.create(comment).then(docComment => {
      return Support.findByIdAndUpdate(
        supportId,
        { $push: { comments: docComment._id } },
        { new: true, useFindAndModify: false }
      );
    });
};

const buildResponse = function (status, msg, payload ){
    response.status = '09';
    response.message = 'Failed';
    response.payload = '';
    if(status == true){
        response.status = '00'
    }
    if(msg){
        response.message = msg;
    }
    if(payload){
        response.payload = payload;
    }
    return response;
}

module.exports = {
    buildResponse:buildResponse,
    sign: signAuthToken,
    refreshToken: signRefreshToken,
    hashPassword: hashPassword,
    validatePassword: compareHashPassword,
    verifyRole: authenticateUserRole,
    validateUser: validateUser,
    validateUserById: validateUserById,
    authenticate: authenticateToken,
    userFromToken: getUserFromToken,
    userFromRefreshToken: getUserFromRefreshToken,
    authenticateRole: authenticateUserByRole,
    addComment: createComment
}