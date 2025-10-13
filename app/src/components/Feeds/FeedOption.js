import React from 'react';
import { components } from 'react-select';
import { useTranslation } from 'react-i18next';

import Image from '../Image';

import { ReactComponent as RSSIcon } from '../../images/icons/rss.svg';
import { ReactComponent as SearchIcon } from '../../images/icons/magnify.svg';

export const RSSIndicator = (props) => {
	return (
		<components.DropdownIndicator {...props}>
			<RSSIcon />
		</components.DropdownIndicator>
	);
};

export const SearchIndicator = (props) => {
	return (
		<components.DropdownIndicator {...props}>
			<SearchIcon />
		</components.DropdownIndicator>
	);
};

export const NoOptionsMessage = (props) => {
	const { t } = useTranslation();
	return (
		<components.NoOptionsMessage {...props}>
			{t('No feeds found')}
		</components.NoOptionsMessage>
	);
};

export const Option = ({ data, children, ...rest }) => {
	return (
		<components.Option {...rest}>
			{data.feed ? (
				<div className="item">
					<div className="icon">
						<Image relative={true} src={`/images/feed/${data.feed.id}?w=60&h=60`} />
					</div>
					<div className="title">{data.feed.title}</div>
				</div>
			) : (
				children
			)}
		</components.Option>
	);
};

export const Input = (props) => <components.Input {...props} isHidden={false} />;
