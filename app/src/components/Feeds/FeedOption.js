import React from 'react';
import { components } from 'react-select';
import { useTranslation } from 'react-i18next';
import { IconRss, IconSearch } from '@tabler/icons-react';

import Image from '../Image';

export const RSSIndicator = (props) => {
	return (
		<components.DropdownIndicator {...props}>
			<IconRss />
		</components.DropdownIndicator>
	);
};

export const SearchIndicator = (props) => {
	return (
		<components.DropdownIndicator {...props}>
			<IconSearch />
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
