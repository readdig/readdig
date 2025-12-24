import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import {
	IconPlus,
	IconPencil,
	IconX,
	IconStar,
	IconStarFilled,
} from '@tabler/icons-react';

import { Menu, MenuButton, MenuItem, MenuDivider, FocusableItem } from '../Menu';
import Loader from '../Loader';
import SearchInput from '../SearchInput';
import RenameModal from '../Tags/RenameModal';
import DeleteModal from '../Tags/DeleteModal';
import { starArticle, unstarArticle, updateStar } from '../../api/star';
import { getTags, addTag } from '../../api/tag';

const ArticleStar = ({ article = {} }) => {
	const dispatch = useDispatch();
	const { t } = useTranslation();
	const [name, setName] = useState('');
	const [data, setData] = useState([]);
	const [tag, setTag] = useState();
	const [anchorRef, setAnchorRef] = useState();
	const [skipClick, setSkipClick] = useState();
	const [loading, setLoading] = useState(false);
	const [modalIsOpen, setModalIsOpen] = useState();
	const [menuIsOpen, setMenuIsOpen] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		const fetchData = async () => {
			if (menuIsOpen) {
				const res = await getTags({
					name,
					articleId: article.id,
					page: 1,
					per_page: 5,
				});
				setData(res.data);
			}
		};
		fetchData();
	}, [name, menuIsOpen, article.id]);

	const onStar = async () => {
		try {
			setLoading(true);
			await starArticle(dispatch, article.id);
			setLoading(false);
		} catch (err) {
			setLoading(false);
		}
	};

	const onUnstar = async () => {
		try {
			setMenuIsOpen(false);
			setLoading(true);
			await unstarArticle(dispatch, article.id);
			setLoading(false);
		} catch (err) {
			setLoading(false);
		}
	};

	const onSubmit = async (e) => {
		e.preventDefault();
		e.stopPropagation();

		try {
			if (name) {
				toast.dismiss();
				setSubmitting(true);
				await addTag(name);
				setSubmitting(false);
				setName('');
			}
		} catch (err) {
			setSubmitting(false);
		}
	};

	const toggleTag = async (tagId) => {
		await updateStar(dispatch, article.id, tagId);
	};

	const openMenu = async (anchorRef, skipClick) => {
		if (!article.stared) {
			await onStar();
		}
		if (!loading) {
			setAnchorRef(anchorRef);
			setSkipClick(skipClick);
			setMenuIsOpen(true);
		}
	};

	const closeMenu = () => {
		setMenuIsOpen(false);
		setName('');
	};

	const openModal = (e, modal, tag) => {
		e.preventDefault();
		e.stopPropagation();
		setTag(tag);
		setModalIsOpen(modal);
	};

	const closeModal = () => {
		setModalIsOpen();
		setTag();
	};

	return (
		<>
			<MenuButton onClick={!loading && openMenu}>
				{!article.stared ? (
					<span className="star" title={t('Star article')}>
						{loading ? <Loader /> : <IconStar />}
					</span>
				) : (
					<span className="star" title={t('Unstar article')}>
						{loading ? <Loader /> : <IconStarFilled />}
					</span>
				)}
			</MenuButton>
			<Menu
				arrow={true}
				align="center"
				transition={true}
				direction="bottom"
				className="menu-small"
				isOpen={menuIsOpen}
				anchorRef={anchorRef}
				skipClick={skipClick}
				onClose={closeMenu}
			>
				{article.stared && (
					<>
						<FocusableItem style={{ justifyContent: 'center' }}>
							{({ ref }) => (
								<div className="btn" title={t('Unstar')} onClick={onUnstar}>
									{t('Unstar')}
								</div>
							)}
						</FocusableItem>
						<MenuDivider />
					</>
				)}
				<FocusableItem style={{ justifyContent: 'center' }}>
					{({ ref }) => (
						<form className="add-input" onSubmit={onSubmit}>
							<SearchInput
								inputRef={ref}
								type="text"
								placeholder={t('Name')}
								value={name}
								onChange={setName}
							/>
							<button
								type="submit"
								className="btn"
								title={t('New tag')}
								disabled={
									!name ||
									(data.length > 0 && data.find((f) => f.name === name)) ||
									submitting
								}
							>
								<IconPlus />
							</button>
						</form>
					)}
				</FocusableItem>
				{data.length > 0 && (
					<>
						<MenuDivider />
						{data.map((item) => (
							<MenuItem
								type="checkbox"
								key={item.id}
								title={item.name}
								checked={
									!!(
										article.stars &&
										Array.isArray(article.stars) &&
										article.stars.find((f) => f && f.id === item.id)
									)
								}
								onClick={() => toggleTag(item.id)}
							>
								<div className="name">{item.name}</div>
								<div className="action">
									<i
										className="icon"
										title={t('Rename')}
										onClick={(e) => openModal(e, 'rename', item)}
									>
										<IconPencil />
									</i>
									<i
										className="icon"
										title={t('Delete')}
										onClick={(e) => openModal(e, 'delete', item)}
									>
										<IconX />
									</i>
								</div>
							</MenuItem>
						))}
					</>
				)}
			</Menu>
			<RenameModal tag={tag} isOpen={modalIsOpen === 'rename'} closeModal={closeModal} />
			<DeleteModal
				tag={tag}
				articleId={article.id}
				isOpen={modalIsOpen === 'delete'}
				closeModal={closeModal}
			/>
		</>
	);
};

export default ArticleStar;
