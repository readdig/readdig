import React from 'react';
import { useSelector } from 'react-redux';
import { Route, Switch } from 'react-router-dom';
import classNames from 'classnames';

import PageTitle from '../components/PageTitle';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import ArticlePanel from '../components/Feeds/ArticlePanel';
import Feeds from '../views/Feeds';
import Articles from '../views/Articles';
import useFontSize from '../hooks/useFontSize';
import useWindowScroll from '../hooks/useWindowScroll';
import useSubscriptionExpired from '../hooks/useSubscriptionExpired';

const Dashboard = () => {
	useFontSize();
	useWindowScroll();
	useSubscriptionExpired();

	const user = useSelector((state) => state.user || {});
	const menuIsOpen = useSelector((state) =>
		state.menuIsOpen === undefined || state.menuIsOpen === null ? true : state.menuIsOpen,
	);
	const mobileHideSidebar = (user.settings || {}).mobileHideSidebar;

	return (
		<>
			<Header />
			<div
				className={classNames('main', {
					hide: mobileHideSidebar,
					toggler: !menuIsOpen,
				})}
			>
				<PageTitle />
				<Sidebar />
				<Switch>
					<Route component={Feeds} path="/feeds" />
					<Route component={Articles} path="/articles" />
					<Route
						component={ArticlePanel}
						path="/folder/:folderId/feed/:feedId/article/:articleId"
					/>
					<Route component={ArticlePanel} path="/folder/:folderId/feed/:feedId" />
					<Route component={ArticlePanel} path="/folder/:folderId/article/:articleId" />
					<Route component={ArticlePanel} path="/folder/:folderId" />
					<Route component={ArticlePanel} path="/feed/:feedId/article/:articleId" />
					<Route component={ArticlePanel} path="/feed/:feedId" />
					<Route component={ArticlePanel} path="/recent-played/article/:articleId" />
					<Route component={ArticlePanel} path="/recent-played" />
					<Route component={ArticlePanel} path="/recent-read/article/:articleId" />
					<Route component={ArticlePanel} path="/recent-read" />
					<Route component={ArticlePanel} path="/stars/article/:articleId" />
					<Route component={ArticlePanel} path="/stars" />
					<Route component={ArticlePanel} path="/article/:articleId" />
					<Route component={ArticlePanel} path="/" />
				</Switch>
			</div>
		</>
	);
};

export default Dashboard;
