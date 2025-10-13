import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import config from '../../config';
import ShareModal from './ShareModal';

import { ReactComponent as ShareIcon } from '../../images/icons/share-variant-outline.svg';

const ArticleStared = ({ article = {} }) => {
	const { t } = useTranslation();
	const [modalIsOpen, setModalIsOpen] = useState(false);

	const onShare = async () => {
		if (navigator.share) {
			try {
				await navigator.share({
					title: article.title,
					text: article.title,
					url: `${config.product.url}/share/${article.id}`,
				});
			} catch (err) {
				// XXX
			}
		} else {
			setModalIsOpen(true);
		}
	};

	const closeModal = () => {
		setModalIsOpen(false);
	};

	return (
		<>
			<span className="sharing" title={t('Share article')} onClick={onShare}>
				<ShareIcon />
			</span>
			<ShareModal isOpen={modalIsOpen} shareId={article.id} closeModal={closeModal} />
		</>
	);
};

export default ArticleStared;
