import React, { useState, useCallback, useEffect } from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

import Loader from '../../../components/Loader';
import PageTitle from '../../../components/PageTitle';
import SearchInput from '../../../components/SearchInput';
import MoreButton from '../../../components/MoreButton';
import Paging from '../../../components/Paging';

import CategoryModal from './CategoryModal';
import FeedsModal from './FeedsModal';
import DeleteModal from './DeleteModal';
import ActionPopover from './ActionPopover';

import { getCategories } from '../../../api/category';

import { IconCategory, IconPlus } from '@tabler/icons-react';
import * as TablerIcons from '@tabler/icons-react';

// Helper to render tabler icon by name
const renderTablerIcon = (iconName, size = 18, color = null) => {
	const IconComponent = TablerIcons[iconName];
	if (!IconComponent) return null;
	return <IconComponent size={size} stroke={1.5} color={color} />;
};

// Helper to render category icon
const renderCategoryIcon = (cat) => {
	if (!cat.icon) {
		return <IconCategory />;
	}
	if (cat.icon.startsWith('http') || cat.icon.startsWith('/')) {
		return (
			<img
				src={cat.icon}
				alt={cat.name}
				style={{ width: 18, height: 18, objectFit: 'contain' }}
			/>
		);
	}
	if (cat.icon.startsWith('Icon')) {
		return renderTablerIcon(cat.icon, 18, cat.color);
	}
	return <span style={{ fontSize: '1rem', lineHeight: 1 }}>{cat.icon}</span>;
};

const Categories = () => {
	const { t } = useTranslation();
	const [loading, setLoading] = useState(true);
	const [category, setCategory] = useState();
	const [categories, setCategories] = useState([]);
	const [modal, setModal] = useState({});
	const [popover, setPopover] = useState({});
	const [filters, setFilters] = useState({
		page: 1,
		per_page: 10,
	});

	const fetchData = useCallback(async () => {
		try {
			setLoading(true);
			const res = await getCategories(filters);
			setCategories(res.data);
			setLoading(false);
		} catch (err) {
			setLoading(false);
			toast.error(t('Failed to load categories'));
		}
	}, [filters, t]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const openPopover = (anchorRef, skipClick, category) => {
		setCategory(category);
		setPopover({
			anchorRef,
			skipClick,
			id: popover.id === category.id ? '' : category.id,
			isOpen: !popover.isOpen,
		});
	};

	const closePopover = () => {
		setPopover({});
	};

	const openModal = (modalType, category) => {
		setCategory(category);
		setModal({ [modalType]: true });
	};

	const closeModal = () => {
		setModal({});
	};

	return (
		<>
			<PageTitle title={t('Manage categories')} />
			<h1>{t('Manage categories')}</h1>
			<div className="filters">
				<div className="box">
					<SearchInput
						type="text"
						placeholder={t('Search categories')}
						onChange={(value) => {
							setFilters({ ...filters, name: value });
						}}
					/>
				</div>
				<button
					className="btn icon"
					onClick={() => openModal('categoryModalIsOpen')}
					type="button"
					title={t('Add category')}
				>
					<IconPlus />
				</button>
			</div>
			<div className="settings-list">
				{loading && <Loader />}
				{!loading && categories.length === 0 && (
					<div className="no-content">{t('No categories found')}</div>
				)}
				{!loading && categories.length > 0 && (
					<ul>
						{categories.map((cat) => (
							<li
								key={cat.id}
								className={classNames('item', {
									active: popover.id === cat.id,
								})}
								onClick={() => openModal('feedsModalIsOpen', cat)}
							>
								<div className="left">
									<div className="icon">{renderCategoryIcon(cat)}</div>
								</div>
								<div className="right">
									<div className="info">
										<div className="title" title={cat.name}>
											{cat.name}
										</div>
										<div className="action">
											<MoreButton
												onClick={(anchorRef, skipClick) => {
													openPopover(anchorRef, skipClick, cat);
												}}
											/>
										</div>
									</div>
									{cat.description && (
										<div className="meta">
											<span>{cat.description}</span>
										</div>
									)}
									<div className="meta">
										<span>{t('{{feedCount}} feeds', { feedCount: cat.feedCount })}</span>
									</div>
								</div>
							</li>
						))}
					</ul>
				)}
				{(categories.length > 0 || (categories.length === 0 && filters.page > 1)) && (
					<Paging
						page={filters.page}
						per_page={filters.per_page}
						totals={categories.length}
						onChange={(value) => {
							setFilters({ ...filters, page: value });
						}}
					/>
				)}
			</div>
			<ActionPopover
				{...popover}
				category={category}
				onClose={closePopover}
				onEdit={() => {
					closePopover();
					openModal('categoryModalIsOpen', category);
				}}
				onDelete={() => {
					closePopover();
					openModal('deleteModalIsOpen', category);
				}}
				onManageFeeds={() => {
					closePopover();
					openModal('feedsModalIsOpen', category);
				}}
			/>
			<CategoryModal
				category={category}
				isOpen={modal.categoryModalIsOpen}
				closeModal={closeModal}
				onEnd={fetchData}
			/>
			<FeedsModal
				category={category}
				isOpen={modal.feedsModalIsOpen}
				closeModal={closeModal}
				onEnd={fetchData}
			/>
			<DeleteModal
				category={category}
				isOpen={modal.deleteModalIsOpen}
				closeModal={closeModal}
				onEnd={fetchData}
			/>
		</>
	);
};

export default Categories;
