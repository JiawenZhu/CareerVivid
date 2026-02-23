import React from 'react';
import CardTemplate from './CardTemplate';
import { PortfolioTemplateProps } from '../../types/portfolio';

const CardPhoto: React.FC<PortfolioTemplateProps> = (props) => (
    <CardTemplate {...props} variant="photo" />
);

export default CardPhoto;
