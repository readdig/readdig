import React from 'react';

import ArticleFeed from './ArticleFeed';
import ArticleStar from './ArticleStar';
import ArticleLike from './ArticleLike';
import ArticleShare from './ArticleShare';
import ArticleFulltext from './ArticleFulltext';
import ArticlePaging from './ArticlePaging';

const ArticleHeader = ({ article = {} }) => {
	return (
		<div className="article-header">
			<ArticleFeed feed={article.feed} />
			<div className="action">
				<ArticlePaging article={article} />
				<ArticleFulltext article={article} />
				<ArticleStar article={article} />
				<ArticleLike article={article} />
				<ArticleShare article={article} />
			</div>
		</div>
	);
};

export default ArticleHeader;
