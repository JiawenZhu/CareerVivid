import React from 'react';
import CardTemplate from './CardTemplate';
import { PortfolioTemplateProps } from '../../types/portfolio';

const CardModern: React.FC<PortfolioTemplateProps> = (props) => (
    <CardTemplate {...props} variant="modern" />
);

export default CardModern;
