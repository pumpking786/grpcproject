const express = require('express');

module.exports = (blogStub) => {
  const router = express.Router();

  router.post('/create', (req, res) => {
    const { title, content, author } = req.body;
    blogStub.CreateBlog({ title, content, author }, (err, response) => {
      if (err) return res.status(500).send('Error creating blog.');
      res.status(200).json(response);
    });
  });

  router.get('/:blogId', (req, res) => {
    blogStub.GetBlog({ blogId: req.params.blogId }, (err, response) => {
      if (err) return res.status(404).send('Blog not found.');
      res.status(200).json(response);
    });
  });

  router.get('/', (req, res) => {
    blogStub.GetAllBlogs({}, (err, response) => {
      if (err) return res.status(500).send('Error fetching blogs.');
      res.status(200).json(response.blogs);
    });
  });

  router.put('/update',  (req, res) => {
    const { blogId, title, content, author, likes, dislikes } = req.body;
    const requestData = { blogId, title, content, author };

    if (likes !== undefined) requestData.likes = likes;
    if (dislikes !== undefined) requestData.dislikes = dislikes;

    blogStub.UpdateBlog(requestData, (err, response) => {
      if (err) return res.status(500).send('Error updating blog.');
      res.status(200).json(response);
    });
  });

  router.delete('/delete/:blogId',  (req, res) => {
    blogStub.DeleteBlog({ blogId: req.params.blogId }, (err, response) => {
      if (err) return res.status(404).send('Blog not found.');
      res.status(200).json(response);
    });
  });

  router.post('/like/:blogId',  (req, res) => {
    blogStub.LikeBlog({ blogId: req.params.blogId }, (err, response) => {
      if (err) return res.status(404).send('Blog not found.');
      res.status(200).json(response);
    });
  });

  router.post('/dislike/:blogId',  (req, res) => {
    blogStub.DislikeBlog({ blogId: req.params.blogId }, (err, response) => {
      if (err) return res.status(404).send('Blog not found.');
      res.status(200).json(response);
    });
  });

  return router;
};
