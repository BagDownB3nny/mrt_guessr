import React from 'react';
import styles from './topBar.module.css';

interface Props {
    currentStation: String
}

const FixedBar: React.FC<Props> = (props) => {
    const { currentStation } = props; 

    return (
        <div className ={styles.fixedBar}>
            {currentStation}
        </div>
    );
};

export default FixedBar;