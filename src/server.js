/**
 * Created by rs on 29/03/16.
 */

import express from 'express';
import bodyParser from 'body-parser'
import path from 'path'
import mongoose from 'mongoose'
import logger from 'morgan'
import ok from 'okay'

const app = express();
app.set('port', (process.env.PORT || 5000));

app.use('/', express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(logger('dev'));

const dbUri = "mongodb://localhost:27017/api";
const dbConnection = mongoose.createConnection(dbUri);
const Schema = mongoose.Schema;

const postSchema = new Schema({
	title: {
		type: String,
		required: true,
		trim: true,
		match: /^([\w, .!?]{1,100})$/
	},
	text: {
		type: String,
		trim: true,
		max: 2000
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
			name: String
		}
	}]
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
	console.log("Retrieving posts");
	Post.find({}, (error, posts) => {
		if (error) return next(error);
		res.send(posts);
	});
});

app.post('/posts', (req, res, next) => {
	console.log("Posting posts");
	const post = new Post(req.body);
	post.validate((error, results) => {
		if (error) {
			console.log("Error:" + error);
			return next(error);
		}
		post.save((error, results) => {
			if (error) next(error);
			res.send(results);
		})
	});
});

app.listen(app.get('port'), () => {
	console.log('Server started: http://localhost:' + app.get('port') + '/');
});