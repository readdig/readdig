import React from 'react';
import { Route, Switch } from 'react-router-dom';

import ArticleList from './ArticleList';
import StarArticleList from './StarArticleList';
import ReadArticleList from './ReadArticleList';
import PlayedArticleList from './PlayedArticleList';
import ArticlePreview from './ArticlePreview';

const ArticlePanel = () => {
	return (
		<>
			<div className="article-list">
				<Switch>
					<Route component={PlayedArticleList} path="/recent-played/article/:articleId" />
					<Route component={PlayedArticleList} path="/recent-played" />
					<Route component={ReadArticleList} path="/recent-read/article/:articleId" />
					<Route component={ReadArticleList} path="/recent-read" />
					<Route component={StarArticleList} path="/stars/article/:articleId" />
					<Route component={StarArticleList} path="/stars" />
					<Route
						component={ArticleList}
						path="/folder/:folderId/feed/:feedId/article/:articleId"
					/>
					<Route component={ArticleList} path="/folder/:folderId/feed/:feedId" />
					<Route component={ArticleList} path="/folder/:folderId/article/:articleId" />
					<Route component={ArticleList} path="/folder/:folderId" />
					<Route component={ArticleList} path="/feed/:feedId/article/:articleId" />
					<Route component={ArticleList} path="/feed/:feedId" />
					<Route component={ArticleList} path="/article/:articleId" />
					<Route component={ArticleList} path="/" />
				</Switch>
			</div>
			<ArticlePreview />
		</>
	);
};

export default ArticlePanel;
