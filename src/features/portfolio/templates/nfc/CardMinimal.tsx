import React from 'react';
import CardTemplate from './CardTemplate';
import { PortfolioTemplateProps } from '../../types/portfolio';

const CardMinimal: React.FC<PortfolioTemplateProps> = (props) => (
    <CardTemplate {...props} variant="minimal" />
);

export default CardMinimal;
