const blogsRouter = require('express').Router()
const { response, request } = require('express')
const Blog = require('../models/blog')
const User = require('../models/user')
const jwt = require('jsonwebtoken')


blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('userId', { username: 1, name: 1})
  response.status(200).json(blogs)
})

blogsRouter.post('/', async (request, response) => {
  const decodedToken = jwt.verify(request.token, process.env.SECRET)
  if (!request.token ||  !decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' })
  }

  const user = await User.findById(decodedToken.id)
  
  const blog = new Blog({
    title: request.body.title || null , 
    author: request.body.author,
    url: request.body.url || null ,
    likes: request.body.likes || 0,
    userId: user._id
  })

  if (!blog.url && !blog.title) {
    response.status(400).send()
  } else {
    const savedBlog = await blog.save()
    user.blogs = user.blogs.concat(savedBlog._id)
    await user.save()
    response.status(201).json(savedBlog.toJSON())
  }
})

blogsRouter.delete('/:id', async (request, response) => {
  const blogToDelete = await Blog.findById(request.params.id)
  blogToDelete.remove()
  response.status(204).end()
})

blogsRouter.put('/:id', async (request, response) => {
  const blog = {
    title: request.body.title, 
    author: request.body.author,
    url: request.body.url,
    likes: request.body.likes
  }
  
  await Blog.findByIdAndUpdate(request.params.id, blog)
  const updatedBlog = await Blog.findById(request.params.id)
  response.status(200).json(updatedBlog.toJSON())
})

module.exports = blogsRouter