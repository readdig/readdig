import React from 'react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const NotFound = () => {
	const history = useHistory();
	const { t } = useTranslation();

	return (
		<div className="not-found">
			<h1>404</h1>
			<div className="message">
				<div>{t('Looks like there&#39;s nothing here.')}</div>
				<div>
					<button
						className="btn link text"
						onClick={() => {
							window.location.reload(true);
						}}
					>
						{t('刷新页面')}
					</button>
				</div>
			</div>
			<p>
				<a
					href="/"
					onClick={(e) => {
						e.preventDefault();
						history.goBack();
					}}
				>
					{t('Back')}
				</a>
			</p>
		</div>
	);
};

export default NotFound;
