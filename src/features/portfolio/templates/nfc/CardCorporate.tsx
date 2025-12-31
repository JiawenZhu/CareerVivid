import React from 'react';
import CardTemplate from './CardTemplate';
import { PortfolioTemplateProps } from '../../types/portfolio';

const CardCorporate: React.FC<PortfolioTemplateProps> = (props) => {
    return <CardTemplate {...props} variant="corporate" />;
};

export default CardCorporate;
