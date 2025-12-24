import React from 'react';
import { Link, useHistory, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useMediaQuery } from 'react-responsive';
import { useTranslation } from 'react-i18next';
import { IconHome, IconArrowLeft, IconLayoutSidebar } from '@tabler/icons-react';

import SearchBar from './SearchBar';
import UserAvatar from './Avatar/UserAvatar';
import ArticleFeed from './Feeds/ArticleFeed';
import ArticleStar from './Feeds/ArticleStar';
import ArticleLike from './Feeds/ArticleLike';
import ArticleShare from './Feeds/ArticleShare';
import ArticleFulltext from './Feeds/ArticleFulltext';
import ArticlePaging from './Feeds/ArticlePaging';

const Header = ({ icon }) => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const history = useHistory();
	const { articleId } = useParams();
	const menuIsOpen = useSelector((state) =>
		state.menuIsOpen === undefined || state.menuIsOpen === null ? true : state.menuIsOpen,
	);
	const article = useSelector((state) => state.article);
	const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1023px)' });

	const toggleMenu = () => {
		localStorage.setItem('menuIsOpen', !menuIsOpen);
		dispatch({
			type: 'UPDATE_MENU_OPEN',
			menuIsOpen: !menuIsOpen,
		});
	};

	return (
		<header className="header">
			<div className="left">
				{(!icon || icon === 'menu') && (
					<button className="icon menu" onClick={toggleMenu} title={t('Expand/Collapse')}>
						<IconLayoutSidebar size={20} />
					</button>
				)}
				{icon === 'home' && (
					<Link className="icon home" to="/" title={t('Home')}>
						<IconHome size={20} />
					</Link>
				)}
				{isTabletOrMobile && (
					<button
						className="icon back"
						title={t('Back')}
						onClick={() => {
							history.goBack();
						}}
					>
						<IconArrowLeft size={20} />
					</button>
				)}
			</div>
			<div className="middle">
				<SearchBar />
				{isTabletOrMobile &&
					(article ? (
						<div className="feed" key="feed">
							<ArticleFeed feed={article.feed} />
						</div>
					) : (
						!articleId && <div className="title" key="title" />
					))}
			</div>
			<div className="right">
				{isTabletOrMobile && article ? (
					<div className="action">
						<ArticlePaging article={article} />
						<ArticleStar article={article} />
						<ArticleLike article={article} />
						<ArticleFulltext article={article} />
						<ArticleShare article={article} />
					</div>
				) : (
					<UserAvatar />
				)}
			</div>
		</header>
	);
};

export default Header;
