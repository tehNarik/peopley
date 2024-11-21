//import PostModel from '../models/Post.js';

export const getAll = async (req, res) => {
    try{
        const posts = await PostModel.find().populate({path: 'user', select: ['fullname', 'email']}).exec()

        res.json(posts)
    }catch(err){
        console.log(err.message)
        res.status(500).json({
            message: "Не вдалося отримати статті"
        })
    }
}

export const getOne = async (req, res) => {
    try{
        const postId = req.params.id;
        const updatedPost = await PostModel.findOneAndUpdate({
                _id: postId,
            }, {
                $inc: {viewsCount: 1}
            }, {
                returnDocument: 'after'
            })
            res.json(updatedPost);
    }catch(err){
        console.log(err.message)
        res.status(500).json({
            message: "Не вдалося отримати статтю"
        })
    }
}

export const remove = async (req, res) => {
    try{
        const postId = req.params.id;
        const deletedPost = await PostModel.findOneAndDelete({
            _id: postId
        })
        if(!deletedPost){
            return res.status(500).json({
                message: "Не вдалося видалити статтю"
            })
        }
        res.json({
            message: 'success deleted'
        })
    }catch(err){
        console.log(err.message)
        res.status(500).json({
            message: "Не вдалося видалити статтю"
        })
    }
}




export const create = async (req, res)=>{
    try{
        const doc = new PostModel({
            title: req.body.title,
            text: req.body.text,
            user: req.userId
        })
        
        const post = await doc.save();
        console.log('success')
        res.json(post);
    }catch(err){
        console.log(err.message)
        res.status(500).json({
            message: "Не вдалося зробити пост"
        })
    }
}

export const update = async (req, res) => {
    try{
        const postId = req.params.id;
        const post = await PostModel.updateOne({
            _id: postId
        }, {
            title: req.body.title,
            text: req.body.text
        })
        if(!post){
            return res.status(500).json({
                message: "Не вдалося знайти статтю"
            })
        }
        res.json({
            success: true
        })
        
    }catch(err){
        console.log(err.message)
        res.status(500).json({
            message: "Не вдалося знайти пост"
        })
    }
}