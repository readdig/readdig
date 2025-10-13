import React from 'react';
import { Link, useHistory, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useMediaQuery } from 'react-responsive';
import { useTranslation } from 'react-i18next';

import SearchBar from './SearchBar';
import UserAvatar from './Avatar/UserAvatar';
import ArticleFeed from './Feeds/ArticleFeed';
import ArticleStar from './Feeds/ArticleStar';
import ArticleShare from './Feeds/ArticleShare';
import ArticleFulltext from './Feeds/ArticleFulltext';
import ArticlePaging from './Feeds/ArticlePaging';

import { ReactComponent as HomeIcon } from '../images/icons/home-outline.svg';
import { ReactComponent as BackIcon } from '../images/icons/arrow-left.svg';
import { ReactComponent as MenuIcon } from '../images/icons/view-headline.svg';

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
						<MenuIcon />
					</button>
				)}
				{icon === 'home' && (
					<Link className="icon home" to="/" title={t('Home')}>
						<HomeIcon />
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
						<BackIcon />
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
						<ArticleFulltext article={article} />
						<ArticleStar article={article} />
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
