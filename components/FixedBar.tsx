import React from 'react';
import styles from './topBar.module.css';

interface Props {
    currentStation: String
    tries: number
}

const FixedBar: React.FC<Props> = (props) => {
    const { currentStation, tries } = props; 
    const arrayData =  [2, 1, 0]

    return (
        <div className ={styles.fixedBar}>
            <div className={styles.fixedText}>
            {currentStation}
            </div>
            <div className = {styles.triesBox}>
                {arrayData.map(num => {
                    if (tries > num) {
                        return <img src = "/greyX.png" className={styles.try}/>
                    } else {
                        return <img src = "/redX.png" className={styles.try}/>
                    }
                })}
            </div>
        </div>
    );
};

export default FixedBar;