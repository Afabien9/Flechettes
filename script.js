// =======================================================
// 1. DÉFINITION DES CONSTANTES ET FONCTIONS UTILITAIRES
// =======================================================

// Liste des scores possibles au lancer (Triples, Simples, Bullseye)
const TARGET_SCORES = [
    // Triples (60, 57, ..., 3) - Ordre de priorité élevé
    60, 57, 54, 51, 48, 45, 42, 39, 36, 33, 30, 27, 24, 21, 18, 15, 12, 9, 6, 3,
    // Simples + S25
    20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 25
];

// Liste des Doubles pour la finition (D25/50, D20/40, ..., D1/2)
const DOUBLES_SCORES = [
    50, 40, 38, 36, 34, 32, 30, 28, 26, 24, 22, 20, 18, 16, 14, 12, 10, 8, 6, 4, 2
];

/**
 * Traduit une valeur numérique brute en notation de cible (T20, D16, S1).
 * @param {number} value - La valeur du lancer.
 * @returns {string} La notation de la cible.
 */
function value_target(value) {
    if (value <= 0) return ""; 

    if (value === 50) return "D-BULL (50)"; 
    if (value === 25) return "S-BULL (25)"; 

    if (value % 3 === 0 && value <= 60 && value !== 0) 
        return `T${value / 3}`; 

    if (value % 2 === 0 && value <= 40 && value !== 0) 
        return `D${value / 2}`;
   
    return `S${value}`; 
}

/**
 * **CORRECTION DU NaN :** Traduit le nom d'une cible (ex: T20, D-BULL) en sa valeur numérique (ex: 60, 50).
 * C'est cette fonction qui DOIT être utilisée dans display_advice pour les calculs.
 * @param {string} targetName - Le nom de la cible (ex: "T20", "D16").
 * @returns {number} La valeur numérique du tir.
 */
function get_value_from_target_name(targetName) {
    if (targetName.startsWith('À viser')) {
        return 0; // Ignore les marqueurs de préparation
    }
    
    if (targetName.includes('D-BULL')) return 50;
    if (targetName.includes('S-BULL')) return 25;

    const match = targetName.match(/([TDS])(\d+)/);
    if (!match) return 0;

    const prefix = match[1];
    const number = parseInt(match[2]);

    switch (prefix) {
        case 'T':
            return number * 3;
        case 'D':
            return number * 2;
        case 'S':
        default:
            return number;
    }
}


/**
 * Trouve toutes les solutions de "checkout" possibles (finition par un double).
 * Stocke les résultats par type de première fléchette (Triple, Double, Simple).
 * @param {number} score - Le score restant (max 170).
 * @returns {object} Un objet contenant solutions classées (TirsTriple, TirsDouble, TirsSimple, TirsUnDart).
 */
function find_checkouts(score){
    let solutions = {
        TirsTriple: [],
        TirsDouble: [],
        TirsSimple: [],
        TirsUnDart: []
    };

    // Fonction utilitaire pour classer et ajouter une solution
    const add_solution = (coup) => {
        if (coup.length === 0) return;
        const firstTarget = coup[0];
        if (firstTarget.startsWith('T')) {
            solutions.TirsTriple.push(coup);
        } else if (firstTarget.startsWith('D')) {
            solutions.TirsDouble.push(coup);
        } else if (firstTarget.startsWith('S') || firstTarget.includes('S-BULL')) {
            solutions.TirsSimple.push(coup);
        }
    };

    // Priorité 1: 1 Fléchette
    for (const d of DOUBLES_SCORES) {
        if (d === score){
            solutions.TirsUnDart.push([value_target(d)]);
        }
    }

    // Priorité 2 & 3: 2 et 3 Fléchettes
    const maxDarts = score <= 100 ? 2 : 3;

    // Boucle pour 1ère fléchette
    for (const shoot1 of TARGET_SCORES) {
        const remain1 = score - shoot1;
        if (remain1 <= 1) continue; // Si le score restant est 1 ou moins après le premier coup

        // Vérification 2 fléchettes (D1 est la dernière)
        for (const d of DOUBLES_SCORES) {
            if (d === remain1) {
                add_solution([value_target(shoot1), value_target(d)]);
            }
        }
        
        if (maxDarts === 3) {
            // Boucle pour 2ème fléchette
            for (const shoot2 of TARGET_SCORES) {
                const remain2 = remain1 - shoot2;
                if (remain2 <= 1) continue; // Si le score restant est 1 ou moins après le deuxième coup

                // Vérification 3 fléchettes (D2 est la dernière)
                for (const d of DOUBLES_SCORES) { 
                    if (d === remain2) { 
                        add_solution([value_target(shoot1), value_target(shoot2), value_target(d)]);
                    }
                }
            }
        }
    }
    
    return solutions; 
} 

/**
 * Génère des solutions de coup pour un score donné (Checkouts ou Préparations).
 * Privilégie une solution T, une D et une S pour le checkout.
 * @param {number} score - Le score restant.
 * @returns {Array<Array<string>>} Un tableau de solutions (max 5).
 */
function solve_score(score) {
    const solutions = [];
    
    // --- Phase 1: Checkout (2 à 170) ---
    if (score >= 2 && score <= 170) {
        const checkoutOptions = find_checkouts(score);
        
        // 1. Gérer le tir en 1 fléchette (toujours prioritaire)
        if (checkoutOptions.TirsUnDart.length > 0) {
            solutions.push(...checkoutOptions.TirsUnDart);
        }
        
        // 2. Ajouter une option Triple (T20 est le premier de la liste)
        if (checkoutOptions.TirsTriple.length > 0) {
            solutions.push(checkoutOptions.TirsTriple[0]);
        }

        // 3. Ajouter une option Double (commence par D20, D18, etc.)
        if (checkoutOptions.TirsDouble.length > 0) {
            // Cherche le premier tir double qui n'est pas déjà un triplé
            const doubleOption = checkoutOptions.TirsDouble.find(coup => !solutions.some(s => JSON.stringify(s) === JSON.stringify(coup))) || checkoutOptions.TirsDouble[0];
            if (!solutions.includes(doubleOption)) {
                solutions.push(doubleOption);
            }
        }

        // 4. Ajouter une option Simple
        if (checkoutOptions.TirsSimple.length > 0) {
            const simpleOption = checkoutOptions.TirsSimple.find(coup => !solutions.some(s => JSON.stringify(s) === JSON.stringify(coup))) || checkoutOptions.TirsSimple[0];
            if (!solutions.includes(simpleOption)) {
                solutions.push(simpleOption);
            }
        }
        
        if (solutions.length > 0) {
            // Retourne les 5 meilleures options uniques (filtrées pour éviter les doublons)
            const uniqueSolutions = Array.from(new Set(solutions.map(JSON.stringify)), JSON.parse);
            return uniqueSolutions.slice(0, 5);
        }
    }


    // --- Phase 2: Préparation (Score > 170 ou pas de checkout trouvé) ---
    
    if (score > 170) {
        const setup_solutions = [];
        
        // Option 1 : Max Scoring (T20, T20, T20)
        setup_solutions.push(['T20', 'T20', 'T20']);
        
        // Option 2 : Bon score de setup
        const remainingAfterT20T20 = score - 120;
        setup_solutions.push(['T20', 'T20', `À viser ${remainingAfterT20T20}`]);
        
        // Option 3 : Alternative max scoring
        setup_solutions.push(['T19', 'T19', 'T19']);

        return setup_solutions.slice(0, 3);
    }
    
    // Fallback pour les scores sans checkout (ex: 169, 168)
    if (solutions.length === 0 && score > 60) {
        const setup_solutions = [];
        setup_solutions.push(['T20', `À viser ${score - 60}`]);
        setup_solutions.push(['T19', `À viser ${score - 57}`]);
        return setup_solutions.slice(0, 4);
    }
    
    return solutions.slice(0, 4);
}

// =======================================================
// 2. FONCTION D'AFFICHAGE ET DE CONTRÔLE (display_advice)
// =======================================================

function display_advice(){
    const inputScore = document.getElementById('remaining-score');
    const resultDiv = document.getElementById('advice-display'); 
    
    if (!inputScore || isNaN(parseInt(inputScore.value))) {
        resultDiv.innerHTML = `<p class="error-message">Veuillez entrer un nombre valide.</p>`;
        return;
    }
    
    const score = parseInt(inputScore.value);
    let htmlContent = '';
    
    if (score < 2 || score > 501) {
        htmlContent = `<p class="error-message">Veuillez entrer un score entre 2 et 501.</p>`;
        resultDiv.innerHTML = htmlContent;
        return;
    }
    
    const solutions = solve_score(score); 
    
    if (score > 170) {
        htmlContent += `<h2>Conseil d'accumulation : ${score}</h2>`;
        htmlContent += `<p><strong>Visez T20 (Triple 20) :</strong> C'est le segment avec la plus haute valeur (60 points). Concentrez-vous sur le maximum de points.</p>`;
        htmlContent += `<p><strong>Objectif :</strong> Descendre en dessous de 170 pour une finition possible au prochain tour.</p>`;
    }
    
    if (solutions && solutions.length > 0){
        let solutionsHTML = '';
        
        if (score <= 170) {
            htmlContent += `<h2>Conseil pour finir à : ${score}</h2>`;
            htmlContent += `<p>Meilleure solution au checkout </p>`;
        }
        

        solutions.forEach((coup, index) => {
            let scoreNow = score;
            let isCheckout = coup.length > 0 && (coup[coup.length - 1].startsWith('D') || coup[coup.length - 1].includes('D-BULL'));
            const setupDarts = coup.filter(c => !c.startsWith('À viser')).length;

            let coupType = isCheckout ? 'Finition parfaite' : 'Coup de préparation';
            let titre = `Option ${index + 1}: ${coupType}`;
            
            if (!isCheckout) {
                const scoreLeft = score - coup.slice(0, setupDarts).reduce((sum, dart) => sum + get_value_from_target_name(dart), 0);
                titre = `Option ${index + 1}: Préparation en laissant ${scoreLeft} (${setupDarts} fléchette${setupDarts > 1 ? 's' : ''})`;
            }

            const tirListe = coup.map((tir, tirIndex)=> {
                const value = get_value_from_target_name(tir); 

                const remain = scoreNow - value;
                const remainingDisplay = (tirIndex === setupDarts - 1) ? (isCheckout ? '0' : remain) : remain; 
                const conseilDetail = `Fléchette ${tirIndex + 1}: <strong>${tir}</strong>`;

                scoreNow = remain;

                let remainingText = '';
                if (tir.startsWith('À viser')) {
                    remainingText = `(Score laissé : ${scoreNow})`;
                } else if (tirIndex < setupDarts - 1 || isCheckout) {
                    remainingText = `(Score restant : ${remainingDisplay})`;
                } else if (!isCheckout && tirIndex === setupDarts - 1) {
                    remainingText = `(Score laissé : ${scoreNow})`;
                }

                return `<li>${conseilDetail} ${remainingText}</li>`;
            }).join('');
            
            if (!isCheckout && scoreNow > 1 && score <= 170) {
                const nextTarget = (scoreNow <= 170 && find_checkouts(scoreNow).TirsUnDart.length > 0)
                    ? `Le score restant (${scoreNow}) est idéal pour une finition au prochain tour.` 
                    : `Le score restant est ${scoreNow}.`;
                solutionsHTML += `
                     <div class="conseil-note">
                        <strong>Note :</strong> ${nextTarget}
                     </div>
                `;
            }

            solutionsHTML += `
                <div class="conseil-option">
                    <h3>${titre}</h3>
                    <ul class="conseil-list">
                        ${tirListe}
                    </ul>
                </div>
            `;
        });

        htmlContent += solutionsHTML;
    } else {
         htmlContent += `<p class="conseil-bust"><strong>Aucune finition parfaite ou bonne préparation trouvée.</strong> Visez le <strong>T20</strong> (Score restant : ${score - 60}) pour réduire le score de manière significative.</p>`;
    }


    resultDiv.innerHTML = htmlContent;
}


// =======================================================
// 3. ÉCOUTEUR D'ÉVÉNEMENT
// =======================================================

document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('calculate-button');
    if (button) {
        button.addEventListener('click', display_advice); 
    }
    // Afficher un conseil initial au chargement pour le score par défaut (501)
    display_advice();
});