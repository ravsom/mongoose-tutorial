/**
 * Created by rs on 29/03/16.
 */

import express from 'express';
import bodyParser from 'body-parser'
import path from 'path'
import mongoose from 'mongoose'
import logger from 'morgan'
import errorhandler from 'errorhandler'

const app = express();
app.set('port', (process.env.PORT || 5000));

app.use('/', express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(logger('dev'));

const dbUri = "mongodb://localhost:27017/api";
const dbConnection = mongoose.createConnection(dbUri);
const Schema = mongoose.Schema;

const enumRoles = ['user', 'manager', 'staff'];

const postSchema = new Schema({
	title: {
		type: String,
		required: true,
		trim: true,
		match: /^([\w, .!?]{1,100})$/,
		set: (value) => {
			return value.toUpperCase();
		}
	},
	text: {
		type: String,
		trim: true,
		max: 2000,
		get: (value) => {
			return value.toLowerCase();
		}

	},
	followers: [Schema.Types.ObjectId],
	meta: Schema.Types.Mixed,
	published: Boolean,
	createdAt: {
		type: Date,
		default: Date.now(),
		required: true
	},
	viewCounter: Number,
	updatedAt: {
		type: Date,
		default: Date.now(),
		required: true

	},
	comments: [{
		text: {
			type: String,
			trim: true,
			max: 2000
		},
		author: {
			id: {
				type: Schema.Types.ObjectId,
				ref: "User"
			},
			name: String,
			role: {
				type: String,
				enum: enumRoles
			}
		}
	}]
});

//postSchema.virtual('hasComments').get(()=> {
//	console.log('this is: ' + this);
//	return this.comments.length > 0;
//});
postSchema.pre('save', (next) => {
	//this.updatedAt = new Date();
	console.log("Save posts: " + this);
	next();
});

postSchema.virtual('hasComments').get(() => {
	return this.comments.length > 0;
});

const Post = dbConnection.model('Post', postSchema, 'posts');

// Additional middleware which will set headers that we need on each request.
app.use((req, res, next) => {
	// Set permissive CORS header - this allows this server to be used only as
	// an API server in conjunction with something like webpack-dev-server.
	res.setHeader('Access-Control-Allow-Origin', '*');

	// Disable caching so we'll always get the latest comments.
	res.setHeader('Cache-Control', 'no-cache');
	next();
});

app.get('/', (req, response) => {
	console.log("Hello");
	response.send("ok again")
});

app.get('/posts', (req, res, next) => {
	Post.find({}, (error, posts) => {
		if (error) res.send(error);
		res.send(posts);
	});
});

app.post('/posts', (req, res, next) => {
	const post = new Post(req.body);
	postValidateSave(next, res, post);
});

app.get('/posts/:id', (req, res, next) => {
	postFindOne(next, req.params.id, (post) => {
		if (post) {
			res.send(post.toJSON({getters: true, virtuals: true}));
			return;
		}
		res.send("No post to send")
	});
});

app.get('/postIdTitle', (req, res, next) => {
	//1 - query param
	//2 - fields
	//3 - fiter - limit, sort
	//4 - callback
	Post.find({}, {title: true, text: true, _id: false}, {limit: 10, sort: {title: -1}}, (error, post) => {
		if (error) {
			res.send("Error");
			return;
		}
		res.send(post);
	});

});

app.get("/newposts", (req, res, next) => {
	res.send('new posts');
});

app.delete('/post/:id', (req, res, next) => {
	postFindOne(next, req.params.id, (post) => {
		if (!post) {
			res.send("no post to delete");
			return;
		}
		post.remove((outcome) => {
			if (outcome) {
				res.send(outcome);
				return;
			}
			res.send("No results")
		});
	})
});

app.delete('/postByTitle/:title', (req, res, next) => {
	console.log("Deleting post with titles of type:  " + req.params.title);
	res.send('deleteing post ' + req.params.title);
});

const postFindOne = (next, id, callback) => {
	Post.findOne({"_id": id}, (error, post) => {
			if (error) {
				next(error);
			} else {
				callback(post);
			}
		}
	);
};
const postValidateSave = (next, res, post) => {
	post.validate((error) => {
		if (error) res.send("Problem saving :" + error);
		post.save((error, result) => {
			if (error) {
				console.log("Error saving:" + error);
				next(error);
				return;
			}
			if (result) {
				res.send(result.toJSON());
				return;
			}
			res.send("no records to send for the given post");
		})
	})

};

app.put('/posts/:id', (req, res, next) => {
	console.log("Post id:" + req.params.id);
	postFindOne(next, req.params.id, (post) => {
		post.set(req.body);
		postValidateSave(next, res, post);
	});
});
app.use(errorhandler());

app.listen(app.get('port'), () => {
	console.log('Server started: http://localhost:' + app.get('port') + '/');
});