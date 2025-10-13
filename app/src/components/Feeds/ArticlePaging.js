import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import { sort } from 'fast-sort';
import { useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { ReactComponent as UpIcon } from '../../images/icons/chevron-up.svg';
import { ReactComponent as DownIcon } from '../../images/icons/chevron-down.svg';

const ArticlePaging = ({ article = {} }) => {
	const history = useHistory();
	const location = useLocation();
	const { t } = useTranslation();
	const orderArticles = useSelector((state) =>
		sort(Object.values(state.articles || {}))
			.desc((a) => a.orderedAt)
			.map((a) => a.id),
	);
	const [prevDisabled, setPrevDisabled] = useState(false);
	const [nextDisabled, setNextDisabled] = useState(false);

	useEffect(() => {
		const currentIndex = orderArticles.findIndex((item) => article.id === item);
		if (currentIndex - 1 >= 0) {
			setPrevDisabled(false);
		} else {
			setPrevDisabled(true);
		}
		if (currentIndex + 1 !== orderArticles.length) {
			setNextDisabled(false);
		} else {
			setNextDisabled(true);
		}
	}, [article.id, orderArticles]);

	const prev = () => {
		const currentIndex = orderArticles.findIndex((item) => article.id === item);

		if (currentIndex - 1 >= 0) {
			const articleId = orderArticles[currentIndex - 1];
			const articleUrl = location.pathname.replace(
				/\/article\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/,
				`/article/${articleId}`,
			);
			history.replace(articleUrl);
		}
	};

	const next = () => {
		const currentIndex = orderArticles.findIndex((item) => article.id === item);

		if (currentIndex + 1 !== orderArticles.length) {
			const articleId = orderArticles[currentIndex + 1];
			const articleUrl = location.pathname.replace(
				/\/article\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/,
				`/article/${articleId}`,
			);
			history.replace(articleUrl);
		}
	};

	return (
		<>
			<span
				title={t('Previous article')}
				className={classNames('prev', { disabled: prevDisabled })}
				onClick={!prevDisabled ? prev : undefined}
			>
				<UpIcon />
			</span>
			<span
				title={t('Next article')}
				className={classNames('next', { disabled: nextDisabled })}
				onClick={!nextDisabled ? next : undefined}
			>
				<DownIcon />
			</span>
		</>
	);
};

export default ArticlePaging;
