import React, { useContext, useState, useEffect, useCallback } from 'react';
import classNames from 'classnames';
import { toast } from 'react-toastify';
import { ScrollMenu, VisibilityContext } from 'react-horizontal-scrolling-menu';
import { useTranslation } from 'react-i18next';
import {
	IconPlus,
	IconPencil,
	IconX,
	IconChevronLeft,
	IconChevronRight,
	IconChevronsDown,
} from '@tabler/icons-react';

import SearchInput from '../SearchInput';
import RenameModal from './RenameModal';
import DeleteModal from './DeleteModal';
import { Menu, MenuButton, MenuItem, MenuDivider, FocusableItem } from '../Menu';
import { getTags, addTag } from '../../api/tag';

function LeftArrow() {
	const { isFirstItemVisible, scrollPrev, visibleItemsWithoutSeparators, initComplete } =
		useContext(VisibilityContext);

	const [disabled, setDisabled] = useState(
		!initComplete || (initComplete && isFirstItemVisible),
	);
	useEffect(() => {
		if (visibleItemsWithoutSeparators.length) {
			setDisabled(isFirstItemVisible);
		}
	}, [isFirstItemVisible, visibleItemsWithoutSeparators]);

	return (
		<div className="arrow" onClick={() => !disabled && scrollPrev()}>
			<IconChevronLeft />
		</div>
	);
}

function RightArrow() {
	const { isLastItemVisible, scrollNext, visibleItemsWithoutSeparators } =
		useContext(VisibilityContext);

	const [disabled, setDisabled] = useState(
		!visibleItemsWithoutSeparators.length && isLastItemVisible,
	);
	useEffect(() => {
		if (visibleItemsWithoutSeparators.length) {
			setDisabled(isLastItemVisible);
		}
	}, [isLastItemVisible, visibleItemsWithoutSeparators]);

	return (
		<div className="arrow" onClick={() => !disabled && scrollNext()}>
			<IconChevronRight />
		</div>
	);
}

function TagItem({ onClick, className, title, children }) {
	return (
		<div className={className} onClick={onClick} title={title}>
			{children}
		</div>
	);
}

const TagPanel = ({ onChange }) => {
	const pageSize = 9;
	const { t } = useTranslation();
	const [name, setName] = useState('');
	const [tagId, setTagId] = useState('');
	const [tag, setTag] = useState();
	const [page, setPage] = useState(1);
	const [data, setData] = useState([]);
	const [tags, setTags] = useState([]);
	const [submitting, setSubmitting] = useState(false);
	const [modalIsOpen, setModalIsOpen] = useState();
	const [menuIsOpen, setMenuIsOpen] = useState(false);
	const [anchorRef, setAnchorRef] = useState();
	const [skipClick, setSkipClick] = useState();

	const fetchPopular = useCallback(async () => {
		const res = await getTags({
			page: 1,
			per_page: pageSize,
		});
		setData(res.data);
	}, []);

	const fetchTags = useCallback(async () => {
		const res = await getTags({
			name,
			page,
			per_page: pageSize,
		});
		setTags(res.data);
	}, [name, page]);

	useEffect(() => {
		fetchPopular();
	}, [fetchPopular]);

	useEffect(() => {
		fetchTags();
	}, [fetchTags]);

	useEffect(() => {
		window.addEventListener('popstate', () => {
			onPopState();
		});
		return () => {
			window.removeEventListener('popstate', () => {
				onPopState();
			});
		};
	}, []);

	const onPopState = () => {
		setMenuIsOpen(false);
	};

	const onWheel = (apiObj, ev) => {
		const isThouchpad = Math.abs(ev.deltaX) !== 0 || Math.abs(ev.deltaY) < 15;

		if (isThouchpad) {
			ev.stopPropagation();
			return;
		}

		if (ev.deltaY < 0) {
			apiObj.scrollNext();
		} else if (ev.deltaY > 0) {
			apiObj.scrollPrev();
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

	const toggleTag = (id) => {
		setTagId(tagId === id ? null : id);
		if (onChange) {
			onChange(tagId === id ? null : id);
		}
	};

	const openMenu = (anchorRef, skipClick) => {
		setAnchorRef(anchorRef);
		setSkipClick(skipClick);
		setMenuIsOpen(true);
	};

	const closeMenu = () => {
		setMenuIsOpen(false);
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
		fetchPopular();
		fetchTags();
	};

	return (
		data.length > 0 && (
			<div className="tag-popular">
				<ScrollMenu LeftArrow={LeftArrow} RightArrow={RightArrow} onWheel={onWheel}>
					<TagItem
						className={classNames('tag-item', {
							active: tagId === 'untag',
						})}
						itemId="untag"
						onClick={() => toggleTag('untag')}
					>
						{t('Ungrouped')}
					</TagItem>
					{data.map((item) => (
						<TagItem
							className={classNames('tag-item', {
								active: tagId === item.id,
							})}
							key={item.id}
							itemId={item.id}
							title={item.name}
							onClick={() => toggleTag(item.id)}
						>
							{item.name}
						</TagItem>
					))}
				</ScrollMenu>
				<MenuButton onClick={openMenu}>
					<div className="open" title={t('More tags')}>
						<IconChevronsDown />
					</div>
				</MenuButton>
				<Menu
					arrow={true}
					align="end"
					transition={true}
					direction="bottom"
					className="menu-small menu-inline"
					isOpen={menuIsOpen}
					anchorRef={anchorRef}
					skipClick={skipClick}
					onClose={closeMenu}
				>
					<FocusableItem style={{ justifyContent: 'center' }}>
						{({ ref }) => (
							<form className="add-input" onSubmit={onSubmit}>
								<SearchInput
									inputRef={ref}
									type="text"
									placeholder={t('Name')}
									value={name}
									onChange={(value) => {
										setName(value);
										setPage(1);
									}}
								/>
								<button
									type="submit"
									className="btn"
									title={t('New tag')}
									disabled={
										!name ||
										(tags.length > 0 && tags.find((f) => f.name === name)) ||
										submitting
									}
								>
									<IconPlus />
								</button>
							</form>
						)}
					</FocusableItem>
					{tags.length > 0 && (
						<>
							<MenuDivider />
							<div className="menu-body">
								<MenuItem
									className={classNames({
										active: tagId === 'untag',
									})}
									onClick={() => toggleTag('untag')}
								>
									<div className="name">{t('Ungrouped')}</div>
								</MenuItem>
								{tags.map((item) => (
									<MenuItem
										key={item.id}
										title={item.name}
										className={classNames({
											active: tagId === item.id,
										})}
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
							</div>
							<MenuDivider />
							<FocusableItem
								style={{ justifyContent: 'space-between' }}
								className="paging"
							>
								{({ ref }) => (
									<>
										{page === 1 && <div className="disabled">{t('Previous page')}</div>}
										{page === 2 && (
											<div onClick={() => setPage(1)}>{t('Previous page')}</div>
										)}
										{page > 2 && (
											<div onClick={() => setPage(page - 1)}>{t('Previous page')}</div>
										)}
										{tags.length === pageSize && (
											<div onClick={() => setPage(page + 1)}>{t('Next page')}</div>
										)}
										{tags.length < pageSize && (
											<div className="disabled">{t('Next page')}</div>
										)}
									</>
								)}
							</FocusableItem>
						</>
					)}
				</Menu>
				<RenameModal
					tag={tag}
					isOpen={modalIsOpen === 'rename'}
					closeModal={closeModal}
				/>
				<DeleteModal
					tag={tag}
					isOpen={modalIsOpen === 'delete'}
					closeModal={closeModal}
				/>
			</div>
		)
	);
};

export default TagPanel;
