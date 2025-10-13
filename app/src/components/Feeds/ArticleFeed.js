import React from 'react';
import { Link } from 'react-router-dom';

import Image from '../Image';

const ArticleFeed = ({ feed = {}, isLink = true }) => {
	return (
		<>
			{isLink ? (
				<>
					<Link className="icon" to={`/feed/${feed.id}`} title={feed.title}>
						<Image relative={true} src={`/images/feed/${feed.id}?w=60&h=60`} />
					</Link>
					<div className="title">
						<Link to={`/feed/${feed.id}`} title={feed.title}>
							{feed.title}
						</Link>
					</div>
				</>
			) : (
				<>
					<a
						className="icon"
						href={feed.url}
						title={feed.title}
						rel="noopener noreferrer"
					>
						<Image relative={true} src={`/images/feed/${feed.id}?w=60&h=60`} />
					</a>
					<div className="title">
						<a href={feed.url} title={feed.title} rel="noopener noreferrer">
							{feed.title}
						</a>
					</div>
				</>
			)}
		</>
	);
};

export default ArticleFeed;
