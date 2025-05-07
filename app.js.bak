const products = [
    {
        id: 1,
        name: '햇살채운 고춧가루',
        price: 15000,
        description: '국내산 태양초 100%',
        image: 'images/햇살채운_고춧가루.png'
    },
    {
        id: 2,
        name: '동명상회 고춧가루',
        price: 18000,
        description: '청양 태양초 고춧가루',
        image: 'images/동명상회_고춧가루.png'
    },
    {
        id: 3,
        name: '농협 고춧가루',
        price: 12000,
        description: '순창 태양초 고춧가루',
        image: 'images/농협_고춧가루.png'
    },
    {
        id: 4,
        name: '태경 고춧가루',
        price: 16000,
        description: '영양 고춧가루 특품',
        image: 'images/태경_고춧가루.png'
    },
    {
        id: 5,
        name: '영양명가 고춧가루',
        price: 20000,
        description: '영양 고춧가루 명품',
        image: 'images/영양명가_고춧가루.png'
    }
];

function ProductCard({ product }) {
    return React.createElement('div', { className: 'product-card' },
        React.createElement('img', {
            src: product.image,
            alt: product.name,
            className: 'product-image'
        }),
        React.createElement('div', { className: 'product-info' },
            React.createElement('h3', { className: 'product-title' }, product.name),
            React.createElement('p', { className: 'product-price' }, 
                `${product.price.toLocaleString()}원`
            ),
            React.createElement('p', { className: 'product-description' }, 
                product.description
            )
        )
    );
}

function App() {
    const [activeCategory, setActiveCategory] = React.useState('고추가루');

    return React.createElement('div', { id: 'app' },
        React.createElement('div', { 
            id: 'product-list',
            className: 'grid gap-4 px-4 pt-[150px]'
        },
            products.map(product => 
                React.createElement(ProductCard, {
                    key: product.id,
                    product: product
                })
            )
        )
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App)); 